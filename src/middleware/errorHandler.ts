import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { WhatsAppAPIError } from "../utils/whatsappErrors"

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Enhanced error logging
  console.error('💥 [ERROR HANDLER] Error occurred:');
  console.error('💥 [ERROR HANDLER] Error message:', err.message);
  console.error('💥 [ERROR HANDLER] Error stack:', err.stack);
  console.error('💥 [ERROR HANDLER] Request URL:', req.url);
  console.error('💥 [ERROR HANDLER] Request method:', req.method);
  console.error('💥 [ERROR HANDLER] Request body:', req.body);
  console.error('💥 [ERROR HANDLER] Request params:', req.params);
  console.error('💥 [ERROR HANDLER] Request query:', req.query);
  
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

  // Check if this is an auth route - use custom format
  const isAuthRoute = req.url?.includes('/auth') || req.url?.includes('/api/v1/auth');
  
  if (isAuthRoute && err.status) {
    // For auth routes, use custom format with proper error message
    return res.status(err.status).json({
      type: '3',
      message: err.message || 'Authentication error',
      data: null,
    });
  }

  // For other routes, preserve error message if status code is set
  const statusCode = err.status || 500;
  const errorMessage = err.status && err.message ? err.message : "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
  })
}
