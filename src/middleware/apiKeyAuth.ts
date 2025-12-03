import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/ApiKey';
import logger from '../utils/logger';

/**
 * Middleware to authenticate requests using API keys
 * Supports API key in header: X-API-Key or Authorization: Bearer <key>
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract API key from headers
    let apiKey: string | undefined;

    // Check X-API-Key header first
    const xApiKey = req.header('X-API-Key');
    if (xApiKey) {
      apiKey = xApiKey;
    } else {
      // Check Authorization header: Bearer <key>
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Check if it's an API key (starts with carta_)
        if (token.startsWith('carta_')) {
          apiKey = token;
        }
      }
    }

    if (!apiKey) {
      return res.status(401).json({
        type: '401',
        message: 'API key required. Provide via X-API-Key header or Authorization: Bearer header',
        data: null
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('carta_')) {
      return res.status(401).json({
        type: '401',
        message: 'Invalid API key format',
        data: null
      });
    }

    // Extract prefix for faster lookup
    const keyPrefix = apiKey.substring(0, 20);

    // Find the API key by prefix
    const apiKeyDoc = await ApiKey.findOne({
      keyPrefix,
      isActive: true
    }).populate('userId', 'email firstName lastName role');

    if (!apiKeyDoc) {
      logger.warn(`Invalid API key attempt with prefix: ${keyPrefix}`);
      return res.status(401).json({
        type: '401',
        message: 'Invalid or inactive API key',
        data: null
      });
    }

    // Verify the full key matches
    const isValidKey = await apiKeyDoc.compareKey(apiKey);
    if (!isValidKey) {
      logger.warn(`API key mismatch for prefix: ${keyPrefix}`);
      return res.status(401).json({
        type: '401',
        message: 'Invalid API key',
        data: null
      });
    }

    // Check if key is expired
    if (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt) {
      logger.warn(`Expired API key used: ${apiKeyDoc._id}`);
      return res.status(401).json({
        type: '401',
        message: 'API key has expired',
        data: null
      });
    }

    // Check IP whitelist
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (!apiKeyDoc.isIpAllowed(clientIp)) {
      logger.warn(`IP not whitelisted for API key ${apiKeyDoc._id}: ${clientIp}`);
      return res.status(403).json({
        type: '403',
        message: 'IP address not authorized for this API key',
        data: null
      });
    }

    // Update last used timestamp (async, don't wait)
    ApiKey.updateOne(
      { _id: apiKeyDoc._id },
      { lastUsedAt: new Date() }
    ).exec().catch(err => logger.error('Error updating API key lastUsedAt:', err));

    // Attach API key info and user to request
    (req as any).apiKey = {
      id: apiKeyDoc._id,
      name: apiKeyDoc.name,
      scopes: apiKeyDoc.scopes,
      businessId: apiKeyDoc.businessId,
      subDomain: apiKeyDoc.subDomain,
      rateLimit: apiKeyDoc.rateLimit
    };
    (req as any).user = apiKeyDoc.userId;

    next();
  } catch (error: any) {
    logger.error('Error in API key authentication:', error);
    return res.status(500).json({
      type: '500',
      message: 'Internal server error during authentication',
      data: null
    });
  }
};

/**
 * Middleware to check if API key has required scope
 */
export const requireScope = (requiredScope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req as any).apiKey;

    if (!apiKey) {
      return res.status(401).json({
        type: '401',
        message: 'API key authentication required',
        data: null
      });
    }

    // Check if has required scope or wildcard
    if (!apiKey.scopes.includes('*') && !apiKey.scopes.includes(requiredScope)) {
      logger.warn(`API key ${apiKey.id} missing required scope: ${requiredScope}`);
      return res.status(403).json({
        type: '403',
        message: `Insufficient permissions. Required scope: ${requiredScope}`,
        data: null
      });
    }

    next();
  };
};

/**
 * Middleware to check if API key has any of the required scopes
 */
export const requireAnyScope = (requiredScopes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req as any).apiKey;

    if (!apiKey) {
      return res.status(401).json({
        type: '401',
        message: 'API key authentication required',
        data: null
      });
    }

    // Check if has wildcard or any of the required scopes
    if (apiKey.scopes.includes('*')) {
      return next();
    }

    const hasRequiredScope = requiredScopes.some(scope => apiKey.scopes.includes(scope));
    if (!hasRequiredScope) {
      logger.warn(`API key ${apiKey.id} missing required scopes: ${requiredScopes.join(', ')}`);
      return res.status(403).json({
        type: '403',
        message: `Insufficient permissions. Required one of: ${requiredScopes.join(', ')}`,
        data: null
      });
    }

    next();
  };
};

/**
 * Combined middleware that accepts either JWT or API key authentication
 */
export const authenticateApiKeyOrJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const xApiKey = req.header('X-API-Key');

  // If X-API-Key is present, use API key auth
  if (xApiKey) {
    return authenticateApiKey(req, res, next);
  }

  // If Authorization header has API key format, use API key auth
  if (authHeader && authHeader.startsWith('Bearer carta_')) {
    return authenticateApiKey(req, res, next);
  }

  // Otherwise, fall through to JWT auth (assuming you have a JWT middleware)
  // Import your existing JWT middleware here
  next();
};
