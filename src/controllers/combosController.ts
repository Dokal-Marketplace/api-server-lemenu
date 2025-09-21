import { Request, Response, NextFunction } from "express"
import { getExampleData } from "../services/exampleService"
import logger from "../utils/logger"


export const createCombo = async (
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
  
export const getCombo = async (
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


export const getCategories = async (
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
  

  export const updateCombo = async (
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
  

  export const deleteCombo = async (
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
  