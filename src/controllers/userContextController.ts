import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

export const findOne = async (
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



  export const updateChatOn = async (
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


// Get chats
export const findAll = async (
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
  