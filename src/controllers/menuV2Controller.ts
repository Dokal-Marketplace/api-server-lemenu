import { Request, Response, NextFunction } from "express"
import { getExampleData } from "../services/exampleService"
import logger from "src/utils/logger"



export const batchUpdateProducts = async (
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
  
export const getCategory = async (
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





export const getIntegration = async (
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
  
export const batchUpdateCategories = async (
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




export const downloadMenuFile = async (
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
  
export const batchUpdateOptions = async (
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



export const batchUpdateUpdates = async (
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
  
  export const batchUpdateV2Products = async (
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

  export const getIntegrationV2 = async (
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

  export const updateBacthLocal = async (
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


  export const getBotStructure = async (
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