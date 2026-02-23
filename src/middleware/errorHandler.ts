import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { WhatsAppAPIError } from "../utils/whatsappErrors"

/** Fields that should never appear in logs */
const SENSITIVE_FIELDS = new Set([
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'refreshToken', 'secret',
  'apiKey', 'api_key', 'authorization',
  'facebookAccessToken', 'facebookRefreshToken',
  'cardNumber', 'cvv', 'ssn',
])

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body
  const sanitized: any = {}
  for (const [key, value] of Object.entries(body)) {
    sanitized[key] = SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : value
  }
  return sanitized
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Request error', {
    message: err.message,
    url: req.url,
    method: req.method,
    body: sanitizeBody(req.body),
    params: req.params,
    query: req.query,
    stack: err.stack,
  });

  logger.error(err)

  // Check if this is a WhatsApp API error with custom format
  if (err instanceof WhatsAppAPIError) {
    return res.status(err.status).json({
      type: err.type,
      message: err.message,
      data: err.data,
    });
  }

  // Check if route uses WhatsApp format (by checking URL pattern)
  // This handles non-WhatsAppAPIError errors that occur in WhatsApp routes
  const isWhatsAppRoute = req.url?.includes('/whatsapp') || req.url?.includes('/api/v1/whatsapp');

  if (isWhatsAppRoute) {
    // For WhatsApp routes, use the custom format even for generic errors
    return res.status(err.status || 500).json({
      type: '3',
      message: err.message || 'Internal Server Error',
      data: null,
    });
  }

  // Default error format for other routes
  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error",
  })
}
