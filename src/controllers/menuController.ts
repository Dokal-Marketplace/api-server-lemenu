import { Request, Response, NextFunction } from "express"
import { getExampleData } from "src/services/exampleService"
import logger from "src/utils/logger"


  
export const getProductInMenu = async (
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
  