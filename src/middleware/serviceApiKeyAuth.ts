import { Request, Response, NextFunction } from 'express';
import { ServiceApiKey } from '../models/ServiceApiKey';
import logger from '../utils/logger';

/**
 * Middleware to authenticate service-to-service requests using service API keys
 * Supports: X-Service-API-Key header or X-API-Key header with carta_srv_/carta_ext_/carta_prt_ prefix
 */
export const authenticateServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract service API key from headers
    let apiKey: string | undefined;

    // Check X-Service-API-Key header first (preferred for services)
    const xServiceApiKey = req.header('X-Service-API-Key');
    if (xServiceApiKey) {
      apiKey = xServiceApiKey;
    } else {
      // Check X-API-Key header
      const xApiKey = req.header('X-API-Key');
      if (xApiKey && (xApiKey.startsWith('carta_srv_') || xApiKey.startsWith('carta_ext_') || xApiKey.startsWith('carta_prt_'))) {
        apiKey = xApiKey;
      }
    }

    if (!apiKey) {
      return res.status(401).json({
        type: '401',
        message: 'Service API key required. Provide via X-Service-API-Key header',
        data: null
      });
    }

    // Validate service API key format
    if (!apiKey.startsWith('carta_srv_') && !apiKey.startsWith('carta_ext_') && !apiKey.startsWith('carta_prt_')) {
      return res.status(401).json({
        type: '401',
        message: 'Invalid service API key format. Must start with carta_srv_, carta_ext_, or carta_prt_',
        data: null
      });
    }

    // Extract prefix for faster lookup
    const keyPrefix = apiKey.substring(0, 25);

    // Get current environment
    const currentEnv = process.env.NODE_ENV || 'development';

    // Find the service API key
    const serviceApiKeyDoc = await ServiceApiKey.findOne({
      keyPrefix,
      isActive: true,
      environment: currentEnv
    });

    if (!serviceApiKeyDoc) {
      logger.warn(`Invalid service API key attempt with prefix: ${keyPrefix} in ${currentEnv}`);
      return res.status(401).json({
        type: '401',
        message: 'Invalid or inactive service API key',
        data: null
      });
    }

    // Verify the full key matches
    const isValidKey = await serviceApiKeyDoc.compareKey(apiKey);
    if (!isValidKey) {
      logger.warn(`Service API key mismatch for prefix: ${keyPrefix}`);
      return res.status(401).json({
        type: '401',
        message: 'Invalid service API key',
        data: null
      });
    }

    // Check if key is expired
    if (serviceApiKeyDoc.expiresAt && new Date() > serviceApiKeyDoc.expiresAt) {
      logger.warn(`Expired service API key used: ${serviceApiKeyDoc._id}`);
      return res.status(401).json({
        type: '401',
        message: 'Service API key has expired',
        data: null
      });
    }

    // Check IP whitelist
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (!serviceApiKeyDoc.isIpAllowed(clientIp)) {
      logger.warn(`IP not whitelisted for service API key ${serviceApiKeyDoc._id}: ${clientIp}`);
      return res.status(403).json({
        type: '403',
        message: 'IP address not authorized for this service API key',
        data: null
      });
    }

    // Check endpoint restrictions
    const requestPath = req.path;
    if (!serviceApiKeyDoc.isEndpointAllowed(requestPath)) {
      logger.warn(`Endpoint not allowed for service API key ${serviceApiKeyDoc._id}: ${requestPath}`);
      return res.status(403).json({
        type: '403',
        message: 'This endpoint is not authorized for this service API key',
        data: {
          allowedEndpoints: serviceApiKeyDoc.allowedEndpoints
        }
      });
    }

    // Update last used timestamp and request count (async, don't wait)
    ServiceApiKey.updateOne(
      { _id: serviceApiKeyDoc._id },
      {
        lastUsedAt: new Date(),
        $inc: { requestCount: 1 }
      }
    ).exec().catch(err => logger.error('Error updating service API key stats:', err));

    // Attach service API key info to request
    (req as any).serviceApiKey = {
      id: serviceApiKeyDoc._id,
      name: serviceApiKeyDoc.name,
      serviceName: serviceApiKeyDoc.serviceName,
      serviceType: serviceApiKeyDoc.serviceType,
      scopes: serviceApiKeyDoc.scopes,
      environment: serviceApiKeyDoc.environment,
      rateLimit: serviceApiKeyDoc.rateLimit
    };

    // Set a service user context (different from regular users)
    (req as any).serviceUser = {
      type: 'service',
      serviceName: serviceApiKeyDoc.serviceName,
      serviceType: serviceApiKeyDoc.serviceType
    };

    next();
  } catch (error: any) {
    logger.error('Error in service API key authentication:', error);
    return res.status(500).json({
      type: '500',
      message: 'Internal server error during service authentication',
      data: null
    });
  }
};

/**
 * Middleware to check if service API key has required scope
 */
export const requireServiceScope = (requiredScope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const serviceApiKey = (req as any).serviceApiKey;

    if (!serviceApiKey) {
      return res.status(401).json({
        type: '401',
        message: 'Service API key authentication required',
        data: null
      });
    }

    // Check if has required scope or wildcard
    if (!serviceApiKey.scopes.includes('*') && !serviceApiKey.scopes.includes(requiredScope)) {
      logger.warn(`Service API key ${serviceApiKey.id} missing required scope: ${requiredScope}`);
      return res.status(403).json({
        type: '403',
        message: `Insufficient permissions. Required scope: ${requiredScope}`,
        data: {
          hasScopes: serviceApiKey.scopes,
          requiredScope
        }
      });
    }

    next();
  };
};

/**
 * Middleware to check if target service is allowed
 */
export const requireAllowedService = (targetService: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const serviceApiKeyDoc = (req as any).serviceApiKey;

    if (!serviceApiKeyDoc) {
      return res.status(401).json({
        type: '401',
        message: 'Service API key authentication required',
        data: null
      });
    }

    // If no service restrictions, allow
    if (!serviceApiKeyDoc.allowedServices || serviceApiKeyDoc.allowedServices.length === 0) {
      return next();
    }

    // Check if target service is in allowed list
    if (!serviceApiKeyDoc.allowedServices.includes(targetService)) {
      logger.warn(
        `Service ${serviceApiKeyDoc.serviceName} attempted to access unauthorized service: ${targetService}`
      );
      return res.status(403).json({
        type: '403',
        message: `Not authorized to access service: ${targetService}`,
        data: {
          allowedServices: serviceApiKeyDoc.allowedServices
        }
      });
    }

    next();
  };
};

/**
 * Combined middleware that accepts either user API key or service API key
 */
export const authenticateAnyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const xApiKey = req.header('X-API-Key');
  const xServiceApiKey = req.header('X-Service-API-Key');

  // If service API key header is present, use service auth
  if (xServiceApiKey || (xApiKey && (xApiKey.startsWith('carta_srv_') || xApiKey.startsWith('carta_ext_') || xApiKey.startsWith('carta_prt_')))) {
    return authenticateServiceApiKey(req, res, next);
  }

  // Otherwise, fall through to regular API key or JWT auth
  // (Import your regular authenticateApiKey middleware if needed)
  next();
};

/**
 * Middleware to log service-to-service calls
 */
export const logServiceCall = (req: Request, res: Response, next: NextFunction) => {
  const serviceApiKey = (req as any).serviceApiKey;

  if (serviceApiKey) {
    logger.info(`Service call: ${serviceApiKey.serviceName} → ${req.method} ${req.path}`, {
      serviceName: serviceApiKey.serviceName,
      serviceType: serviceApiKey.serviceType,
      method: req.method,
      path: req.path,
      ip: req.ip
    });
  }

  next();
};
