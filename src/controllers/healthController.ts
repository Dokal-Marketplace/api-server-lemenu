import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

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
