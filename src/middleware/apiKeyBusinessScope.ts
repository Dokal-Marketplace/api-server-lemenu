import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to enforce business scope on API key requests
 * Use this after authenticateApiKey to restrict API keys to specific businesses
 */
export const enforceBusinessScope = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = (req as any).apiKey;

  // If no API key is present (JWT auth), skip business scope check
  if (!apiKey) {
    return next();
  }

  // If API key has no business restrictions, allow access to all
  if (!apiKey.businessId && !apiKey.subDomain) {
    return next();
  }

  // Extract business identifiers from the request
  const requestSubDomain = req.params.subDomain || req.query.subDomain || req.body?.subDomain;
  const requestBusinessId = req.params.businessId || req.query.businessId || req.body?.businessId;

  // Check if the request matches the API key's business scope
  let hasAccess = false;

  // Check subdomain match
  if (apiKey.subDomain && requestSubDomain) {
    if (apiKey.subDomain === requestSubDomain) {
      hasAccess = true;
    }
  }

  // Check business ID match
  if (apiKey.businessId && requestBusinessId) {
    if (apiKey.businessId === requestBusinessId) {
      hasAccess = true;
    }
  }

  // If API key is scoped but request doesn't match, deny access
  if (!hasAccess && (apiKey.businessId || apiKey.subDomain)) {
    logger.warn(
      `API key ${apiKey.id} attempted to access business outside its scope. ` +
      `Key scope: {businessId: ${apiKey.businessId}, subDomain: ${apiKey.subDomain}}, ` +
      `Request: {businessId: ${requestBusinessId}, subDomain: ${requestSubDomain}}`
    );

    return res.status(403).json({
      type: '403',
      message: 'API key is not authorized to access this business',
      data: {
        allowedBusiness: apiKey.businessId || apiKey.subDomain,
        requestedBusiness: requestBusinessId || requestSubDomain
      }
    });
  }

  next();
};

/**
 * Middleware factory to enforce specific business scope
 * Use this when you want to ensure the API key matches a specific business parameter
 *
 * @param businessParam - The parameter name to check (e.g., 'subDomain', 'businessId')
 * @param location - Where to look for the parameter ('params', 'query', or 'body')
 */
export const requireBusinessMatch = (
  businessParam: 'subDomain' | 'businessId',
  location: 'params' | 'query' | 'body' = 'params'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = (req as any).apiKey;

    // If no API key, skip (JWT auth doesn't have business scope)
    if (!apiKey) {
      return next();
    }

    // If API key has no business restriction, allow
    if (!apiKey[businessParam]) {
      return next();
    }

    // Get the business identifier from the request
    let requestValue: string;
    if (location === 'params') {
      requestValue = req.params[businessParam];
    } else if (location === 'query') {
      requestValue = req.query[businessParam] as string;
    } else {
      requestValue = req.body?.[businessParam];
    }

    // Check if they match
    if (apiKey[businessParam] !== requestValue) {
      logger.warn(
        `API key ${apiKey.id} business scope mismatch. ` +
        `Expected: ${apiKey[businessParam]}, Got: ${requestValue}`
      );

      return res.status(403).json({
        type: '403',
        message: `API key is restricted to ${businessParam}: ${apiKey[businessParam]}`,
        data: null
      });
    }

    next();
  };
};
