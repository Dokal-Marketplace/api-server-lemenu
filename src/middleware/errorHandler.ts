import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

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
  
  // Can use err.message to show a better message but then custom create Error object.
  //To not expose raw error messages.
  logger.error(err)
  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error",
  })
}
