import { Request, Response, NextFunction } from 'express';
import { ServiceApiKey } from '../models/ServiceApiKey';
import logger from '../utils/logger';

// Available scopes for service API keys
export const SERVICE_SCOPES = [
  '*', // Full access (use sparingly)
  // Service-level scopes
  'service:orders',
  'service:products',
  'service:menu',
  'service:analytics',
  'service:payments',
  'service:notifications',
  'service:webhooks',
  // Admin scopes
  'admin:read',
  'admin:write',
  // Internal microservice scopes
  'internal:cache',
  'internal:queue',
  'internal:events'
];

/**
 * Create a new service API key (Admin only)
 * POST /api/v1/service-api-keys
 */
export const createServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = (req as any).user;
    const {
      name,
      serviceName,
      serviceType,
      scopes,
      allowedServices,
      allowedEndpoints,
      environment,
      expiresIn,
      rateLimit,
      ipWhitelist,
      metadata
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        type: '701',
        message: 'Service API key name is required',
        data: null
      });
    }

    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({
        type: '701',
        message: 'Service name is required',
        data: null
      });
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({
        type: '701',
        message: 'At least one scope is required',
        data: null
      });
    }

    // Validate scopes
    const invalidScopes = scopes.filter(scope => !SERVICE_SCOPES.includes(scope));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        type: '701',
        message: `Invalid scopes: ${invalidScopes.join(', ')}`,
        data: null
      });
    }

    // Validate service type
    const validTypes = ['internal', 'external', 'partner'];
    if (serviceType && !validTypes.includes(serviceType)) {
      return res.status(400).json({
        type: '701',
        message: `Invalid service type. Must be one of: ${validTypes.join(', ')}`,
        data: null
      });
    }

    // Validate environment
    const validEnvs = ['development', 'staging', 'production'];
    if (environment && !validEnvs.includes(environment)) {
      return res.status(400).json({
        type: '701',
        message: `Invalid environment. Must be one of: ${validEnvs.join(', ')}`,
        data: null
      });
    }

    // Generate the service API key
    const { key, prefix } = (ServiceApiKey as any).generateKey(serviceType || 'internal');
    const hashedKey = await (ServiceApiKey as any).hashKey(key);

    // Calculate expiration date if provided
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    }

    // Create the service API key document
    const serviceApiKey = await ServiceApiKey.create({
      name: name.trim(),
      serviceName: serviceName.trim(),
      serviceType: serviceType || 'internal',
      keyPrefix: prefix,
      hashedKey,
      scopes,
      allowedServices: allowedServices || [],
      allowedEndpoints: allowedEndpoints || [],
      rateLimit: rateLimit || {
        maxRequests: 10000,
        windowMs: 3600000 // 1 hour
      },
      ipWhitelist: ipWhitelist || [],
      environment: environment || 'development',
      expiresAt,
      isActive: true,
      metadata: metadata || {},
      createdBy: adminUser?.email || 'system'
    });

    logger.info(`Service API key created: ${serviceApiKey._id} for service: ${serviceName}`);

    // Return the key (ONLY TIME IT'S SHOWN IN PLAIN TEXT)
    return res.status(201).json({
      type: '1',
      message: 'Service API key created successfully. Save this key securely - it will not be shown again.',
      data: {
        id: serviceApiKey._id,
        name: serviceApiKey.name,
        serviceName: serviceApiKey.serviceName,
        serviceType: serviceApiKey.serviceType,
        key, // Plain text key - only shown once
        keyPrefix: serviceApiKey.keyPrefix,
        scopes: serviceApiKey.scopes,
        environment: serviceApiKey.environment,
        rateLimit: serviceApiKey.rateLimit,
        expiresAt: serviceApiKey.expiresAt,
        createdAt: serviceApiKey.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Error creating service API key:', error);
    next(error);
  }
};

/**
 * List all service API keys (Admin only)
 * GET /api/v1/service-api-keys
 */
export const listServiceApiKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceName, serviceType, environment, isActive } = req.query;

    const filter: any = {};
    if (serviceName) filter.serviceName = serviceName;
    if (serviceType) filter.serviceType = serviceType;
    if (environment) filter.environment = environment;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const serviceApiKeys = await ServiceApiKey.find(filter)
      .select('-hashedKey')
      .sort({ createdAt: -1 });

    return res.json({
      type: '1',
      message: 'Service API keys retrieved successfully',
      data: serviceApiKeys.map(key => ({
        id: key._id,
        name: key.name,
        serviceName: key.serviceName,
        serviceType: key.serviceType,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        environment: key.environment,
        allowedServices: key.allowedServices,
        allowedEndpoints: key.allowedEndpoints,
        rateLimit: key.rateLimit,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        requestCount: key.requestCount,
        isActive: key.isActive,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    });
  } catch (error: any) {
    logger.error('Error listing service API keys:', error);
    next(error);
  }
};

/**
 * Get a specific service API key by ID (Admin only)
 * GET /api/v1/service-api-keys/:keyId
 */
export const getServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params;

    const serviceApiKey = await ServiceApiKey.findById(keyId).select('-hashedKey');

    if (!serviceApiKey) {
      return res.status(404).json({
        type: '3',
        message: 'Service API key not found',
        data: null
      });
    }

    return res.json({
      type: '1',
      message: 'Service API key retrieved successfully',
      data: {
        id: serviceApiKey._id,
        name: serviceApiKey.name,
        serviceName: serviceApiKey.serviceName,
        serviceType: serviceApiKey.serviceType,
        keyPrefix: serviceApiKey.keyPrefix,
        scopes: serviceApiKey.scopes,
        environment: serviceApiKey.environment,
        allowedServices: serviceApiKey.allowedServices,
        allowedEndpoints: serviceApiKey.allowedEndpoints,
        rateLimit: serviceApiKey.rateLimit,
        ipWhitelist: serviceApiKey.ipWhitelist,
        expiresAt: serviceApiKey.expiresAt,
        lastUsedAt: serviceApiKey.lastUsedAt,
        requestCount: serviceApiKey.requestCount,
        isActive: serviceApiKey.isActive,
        metadata: serviceApiKey.metadata,
        createdBy: serviceApiKey.createdBy,
        createdAt: serviceApiKey.createdAt,
        updatedAt: serviceApiKey.updatedAt
      }
    });
  } catch (error: any) {
    logger.error('Error getting service API key:', error);
    next(error);
  }
};

/**
 * Update a service API key (Admin only)
 * PATCH /api/v1/service-api-keys/:keyId
 */
export const updateServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params;
    const { name, scopes, isActive, allowedServices, allowedEndpoints, rateLimit, ipWhitelist, metadata } = req.body;

    const serviceApiKey = await ServiceApiKey.findById(keyId);

    if (!serviceApiKey) {
      return res.status(404).json({
        type: '3',
        message: 'Service API key not found',
        data: null
      });
    }

    // Update allowed fields
    if (name !== undefined) serviceApiKey.name = name.trim();
    if (scopes !== undefined) {
      const invalidScopes = scopes.filter((scope: string) => !SERVICE_SCOPES.includes(scope));
      if (invalidScopes.length > 0) {
        return res.status(400).json({
          type: '701',
          message: `Invalid scopes: ${invalidScopes.join(', ')}`,
          data: null
        });
      }
      serviceApiKey.scopes = scopes;
    }
    if (isActive !== undefined) serviceApiKey.isActive = isActive;
    if (allowedServices !== undefined) serviceApiKey.allowedServices = allowedServices;
    if (allowedEndpoints !== undefined) serviceApiKey.allowedEndpoints = allowedEndpoints;
    if (rateLimit !== undefined) serviceApiKey.rateLimit = rateLimit;
    if (ipWhitelist !== undefined) serviceApiKey.ipWhitelist = ipWhitelist;
    if (metadata !== undefined) serviceApiKey.metadata = metadata;

    await serviceApiKey.save();

    logger.info(`Service API key updated: ${serviceApiKey._id}`);

    return res.json({
      type: '1',
      message: 'Service API key updated successfully',
      data: {
        id: serviceApiKey._id,
        name: serviceApiKey.name,
        serviceName: serviceApiKey.serviceName,
        scopes: serviceApiKey.scopes,
        isActive: serviceApiKey.isActive,
        updatedAt: serviceApiKey.updatedAt
      }
    });
  } catch (error: any) {
    logger.error('Error updating service API key:', error);
    next(error);
  }
};

/**
 * Delete a service API key (Admin only)
 * DELETE /api/v1/service-api-keys/:keyId
 */
export const deleteServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params;

    const serviceApiKey = await ServiceApiKey.findByIdAndDelete(keyId);

    if (!serviceApiKey) {
      return res.status(404).json({
        type: '3',
        message: 'Service API key not found',
        data: null
      });
    }

    logger.info(`Service API key deleted: ${keyId}`);

    return res.json({
      type: '1',
      message: 'Service API key deleted successfully',
      data: null
    });
  } catch (error: any) {
    logger.error('Error deleting service API key:', error);
    next(error);
  }
};

/**
 * Revoke a service API key (Admin only)
 * POST /api/v1/service-api-keys/:keyId/revoke
 */
export const revokeServiceApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyId } = req.params;

    const serviceApiKey = await ServiceApiKey.findById(keyId);

    if (!serviceApiKey) {
      return res.status(404).json({
        type: '3',
        message: 'Service API key not found',
        data: null
      });
    }

    serviceApiKey.isActive = false;
    await serviceApiKey.save();

    logger.info(`Service API key revoked: ${keyId}`);

    return res.json({
      type: '1',
      message: 'Service API key revoked successfully',
      data: null
    });
  } catch (error: any) {
    logger.error('Error revoking service API key:', error);
    next(error);
  }
};

/**
 * Get available service scopes (Admin only)
 * GET /api/v1/service-api-keys/scopes
 */
export const getServiceScopes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      type: '1',
      message: 'Service scopes retrieved successfully',
      data: SERVICE_SCOPES.map(scope => ({
        scope,
        description: getServiceScopeDescription(scope)
      }))
    });
  } catch (error: any) {
    logger.error('Error getting service scopes:', error);
    next(error);
  }
};

// Helper function to get scope descriptions
function getServiceScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    '*': 'Full access to all services and endpoints',
    'service:orders': 'Access to order service operations',
    'service:products': 'Access to product service operations',
    'service:menu': 'Access to menu service operations',
    'service:analytics': 'Access to analytics service',
    'service:payments': 'Access to payment service',
    'service:notifications': 'Access to notification service',
    'service:webhooks': 'Access to webhook service',
    'admin:read': 'Read access to admin operations',
    'admin:write': 'Write access to admin operations',
    'internal:cache': 'Access to internal cache service',
    'internal:queue': 'Access to internal queue service',
    'internal:events': 'Access to internal event bus'
  };
  return descriptions[scope] || 'Unknown scope';
}
