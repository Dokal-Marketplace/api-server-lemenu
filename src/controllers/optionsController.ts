import { Request, Response, NextFunction } from "express"
import {
  listModifierOptions,
  createModifierOption,
  updateModifierOption,
  deleteModifierOption,
  createMultipleModifierOptions
} from "../services/productService"

export const createMultipleBusinessLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.body

    if (!modifierId) {
      return res.status(400).json({ 
        success: false, 
        error: "modifierId is required" 
      })
    }

    const result = await createMultipleModifierOptions({
      modifierId,
      options: req.body.options || []
    })

    if (result.error) {
      return res.status(400).json({ 
        success: false, 
        error: result.error 
      })
    }

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}


export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters = {
        ...req.query
      }

      const result = await listModifierOptions(filters)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  export const create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { modifierId } = req.body

      if (!modifierId) {
        return res.status(400).json({ 
          success: false, 
          error: "modifierId is required" 
        })
      }

      const result = await createModifierOption({
        modifierId,
        payload: req.body
      })

      if (result.error) {
        return res.status(400).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.status(201).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
  
  export const deleteOne = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { modifierId, optionId } = req.body

      if (!modifierId || !optionId) {
        return res.status(400).json({ 
          success: false, 
          error: "modifierId and optionId are required" 
        })
      }

      const result = await deleteModifierOption({
        modifierId,
        optionId
      })

      if (result.error) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
  
  export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { modifierId, optionId, ...updates } = req.body

      if (!modifierId || !optionId) {
        return res.status(400).json({ 
          success: false, 
          error: "modifierId and optionId are required" 
        })
      }

      const result = await updateModifierOption({
        modifierId,
        optionId,
        updates
      })

      if (result.error) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
  
  