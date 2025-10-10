import { Request, Response, NextFunction } from "express"
import { getExampleData } from "../services/exampleService"
import logger from "../utils/logger"

export const createMultipleBusinessLocation = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getExampleData()
    logger.warn("REMEMBER: Remove home page")
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}


export const getAll = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  export const create = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
  export const deleteOne = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
  export const update = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
  