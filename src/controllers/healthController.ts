import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import s3Service from "../services/s3Service"

export const getHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {

  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  
  try {
    logger.warn("/health endpoint hit")
    res.send(healthcheck);
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}

export const getS3Health = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    logger.info("S3 health check requested")
    const healthStatus = await s3Service.healthCheck()
    
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
      service: 'S3',
      status: healthStatus.status,
      details: healthStatus.details,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error("Error checking S3 health:", error)
    res.status(503).json({
      service: 'S3',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export const testS3Connection = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    logger.info("S3 connection test requested")
    const testResult = await s3Service.testConnection()
    
    res.status(testResult.success ? 200 : 503).json({
      service: 'S3',
      test: 'connection',
      success: testResult.success,
      details: testResult.details,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error("Error testing S3 connection:", error)
    res.status(503).json({
      service: 'S3',
      test: 'connection',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
