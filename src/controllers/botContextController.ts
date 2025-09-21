import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

export const getBotContext = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}


export const createBotContext = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.warn("/health endpoint hit")
      res.json({ status: "ok" })
    } catch (error) {
      logger.error("Error with Health Controller")
      next(error)
    }
  }



  export const updateBotContext = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.warn("/health endpoint hit")
      res.json({ status: "ok" })
    } catch (error) {
      logger.error("Error with Health Controller")
      next(error)
    }
  }


// Get businesses by owner Id
export const getBotContextes = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      logger.warn("/health endpoint hit")
      res.json({ status: "ok" })
    } catch (error) {
      logger.error("Error with Health Controller")
      next(error)
    }
  }
  