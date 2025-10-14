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
    res.status(200).json({ type: "success", message: "Data retrieved", data })
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
      res.status(200).json({ type: "success", message: "Data retrieved", data })
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
      res.status(200).json({ type: "success", message: "Data retrieved", data })
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
      res.status(200).json({ type: "success", message: "Data retrieved", data })
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
      res.status(200).json({ type: "success", message: "Data retrieved", data })
    } catch (error) {
      next(error)
    }
  }
  
  