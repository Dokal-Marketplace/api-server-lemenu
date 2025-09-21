import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

export const getBusiness = async (
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


export const createBusiness = async (
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

  export const createLocal = async (
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

  
  export const getBusinessLocal = async (
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

  export const updateBusinessLocal = async (
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
export const getBusinesses = async (
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
  