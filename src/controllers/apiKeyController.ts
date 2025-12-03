import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../models/ApiKey';
import logger from '../utils/logger';

// Available scopes for API keys
export const AVAILABLE_SCOPES = [
  '*', // Full access
  'read:products',
  'write:products',
  'read:orders',
  'write:orders',
  'read:menu',
  'write:menu',
  'read:categories',
  'write:categories',
  'read:customers',
  'write:customers',
  'read:analytics',
  'webhook:receive'
];

/**
 * Create a new API key
 * POST /api/v1/api-keys
 */
export const createApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { name, scopes, businessId, subDomain, expiresIn, rateLimit, ipWhitelist, metadata } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        type: '701',
        message: 'API key name is required',
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
    const invalidScopes = scopes.filter(scope => !AVAILABLE_SCOPES.includes(scope));
    if (invalidScopes.length > 0) {
      return res.status(400).json({
        type: '701',
        message: `Invalid scopes: ${invalidScopes.join(', ')}`,
        data: null
      });
    }

    // Generate the API key
    const { key, prefix } = (ApiKey as any).generateKey();
    const hashedKey = await (ApiKey as any).hashKey(key);

    // Calculate expiration date if provided
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn); // expiresIn is in days
    }

    // Create the API key document
    const apiKey = await ApiKey.create({
      name: name.trim(),
      keyPrefix: prefix,
      hashedKey,
      userId,
      businessId,
      subDomain,
      scopes,
      rateLimit: rateLimit || {
        maxRequests: 1000,
        windowMs: 3600000 // 1 hour
      },
      ipWhitelist: ipWhitelist || [],
      expiresAt,
      isActive: true,
      metadata: metadata || {}
    });

    logger.info(`API key created: ${apiKey._id} for user: ${userId}`);

    // Return the key (ONLY TIME IT'S SHOWN IN PLAIN TEXT)
    return res.status(201).json({
      type: '1',
      message: 'API key created successfully. Save this key securely - it will not be shown again.',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key, // Plain text key - only shown once
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Error creating API key:', error);
    next(error);
  }
};

/**
 * List all API keys for the authenticated user
 * GET /api/v1/api-keys
 */
export const listApiKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { businessId, isActive } = req.query;

    const filter: any = { userId };
    if (businessId) filter.businessId = businessId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const apiKeys = await ApiKey.find(filter)
      .select('-hashedKey') // Don't return the hashed key
      .sort({ createdAt: -1 });

    return res.json({
      type: '1',
      message: 'API keys retrieved successfully',
      data: apiKeys.map(key => ({
        id: key._id,
        name: key.name,
        keyPrefix: key.keyPrefix, // Show prefix for identification
        scopes: key.scopes,
        businessId: key.businessId,
        subDomain: key.subDomain,
        rateLimit: key.rateLimit,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        isActive: key.isActive,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    });
  } catch (error: any) {
    logger.error('Error listing API keys:', error);
    next(error);
  }
};

/**
 * Get a specific API key by ID
 * GET /api/v1/api-keys/:keyId
 */
export const getApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({ _id: keyId, userId })
      .select('-hashedKey');

    if (!apiKey) {
      return res.status(404).json({
        type: '3',
        message: 'API key not found',
        data: null
      });
    }

    return res.json({
      type: '1',
      message: 'API key retrieved successfully',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        businessId: apiKey.businessId,
        subDomain: apiKey.subDomain,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        isActive: apiKey.isActive,
        metadata: apiKey.metadata,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt
      }
    });
  } catch (error: any) {
    logger.error('Error getting API key:', error);
    next(error);
  }
};

/**
 * Update an API key
 * PATCH /api/v1/api-keys/:keyId
 */
export const updateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { keyId } = req.params;
    const { name, scopes, isActive, rateLimit, ipWhitelist, metadata } = req.body;

    const apiKey = await ApiKey.findOne({ _id: keyId, userId });

    if (!apiKey) {
      return res.status(404).json({
        type: '3',
        message: 'API key not found',
        data: null
      });
    }

    // Update allowed fields
    if (name !== undefined) apiKey.name = name.trim();
    if (scopes !== undefined) {
      // Validate scopes
      const invalidScopes = scopes.filter((scope: string) => !AVAILABLE_SCOPES.includes(scope));
      if (invalidScopes.length > 0) {
        return res.status(400).json({
          type: '701',
          message: `Invalid scopes: ${invalidScopes.join(', ')}`,
          data: null
        });
      }
      apiKey.scopes = scopes;
    }
    if (isActive !== undefined) apiKey.isActive = isActive;
    if (rateLimit !== undefined) apiKey.rateLimit = rateLimit;
    if (ipWhitelist !== undefined) apiKey.ipWhitelist = ipWhitelist;
    if (metadata !== undefined) apiKey.metadata = metadata;

    await apiKey.save();

    logger.info(`API key updated: ${apiKey._id}`);

    return res.json({
      type: '1',
      message: 'API key updated successfully',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        updatedAt: apiKey.updatedAt
      }
    });
  } catch (error: any) {
    logger.error('Error updating API key:', error);
    next(error);
  }
};

/**
 * Delete an API key
 * DELETE /api/v1/api-keys/:keyId
 */
export const deleteApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOneAndDelete({ _id: keyId, userId });

    if (!apiKey) {
      return res.status(404).json({
        type: '3',
        message: 'API key not found',
        data: null
      });
    }

    logger.info(`API key deleted: ${keyId}`);

    return res.json({
      type: '1',
      message: 'API key deleted successfully',
      data: null
    });
  } catch (error: any) {
    logger.error('Error deleting API key:', error);
    next(error);
  }
};

/**
 * Revoke an API key (soft delete - just deactivate)
 * POST /api/v1/api-keys/:keyId/revoke
 */
export const revokeApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOne({ _id: keyId, userId });

    if (!apiKey) {
      return res.status(404).json({
        type: '3',
        message: 'API key not found',
        data: null
      });
    }

    apiKey.isActive = false;
    await apiKey.save();

    logger.info(`API key revoked: ${keyId}`);

    return res.json({
      type: '1',
      message: 'API key revoked successfully',
      data: null
    });
  } catch (error: any) {
    logger.error('Error revoking API key:', error);
    next(error);
  }
};

/**
 * Get available scopes
 * GET /api/v1/api-keys/scopes
 */
export const getAvailableScopes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      type: '1',
      message: 'Available scopes retrieved successfully',
      data: AVAILABLE_SCOPES.map(scope => ({
        scope,
        description: getScopeDescription(scope)
      }))
    });
  } catch (error: any) {
    logger.error('Error getting available scopes:', error);
    next(error);
  }
};

// Helper function to get scope descriptions
function getScopeDescription(scope: string): string {
  const descriptions: Record<string, string> = {
    '*': 'Full access to all API endpoints',
    'read:products': 'Read product information',
    'write:products': 'Create, update, and delete products',
    'read:orders': 'Read order information',
    'write:orders': 'Create, update, and delete orders',
    'read:menu': 'Read menu information',
    'write:menu': 'Update menu information',
    'read:categories': 'Read category information',
    'write:categories': 'Create, update, and delete categories',
    'read:customers': 'Read customer information',
    'write:customers': 'Create, update, and delete customers',
    'read:analytics': 'Access analytics and reports',
    'webhook:receive': 'Receive webhook events'
  };
  return descriptions[scope] || 'Unknown scope';
}
