import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import * as modifiersService from "../services/modifiersService"

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const modifiers = await modifiersService.listModifiersByLocation(subDomain, localId)
    res.json({ modifiers })
  } catch (error) {
    logger.error("Error getting all modifiers:", error)
    next(error)
  }
}

export const getModifs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await modifiersService.listModifiers(req.query)
    res.json(result)
  } catch (error) {
    logger.error("Error getting modifiers:", error)
    next(error)
  }
}

export const getModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.params
    const modifier = await modifiersService.getModifierById(modifierId)
    if (!modifier) {
      return res.status(404).json({ error: "Modifier not found" })
    }
    res.json({ modifier })
  } catch (error) {
    logger.error("Error getting modifier:", error)
    next(error)
  }
}

export const createModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const result = await modifiersService.createModifierForLocation({
      subDomain,
      localId,
      payload: req.body
    })
    
    if ('error' in result) {
      return res.status(400).json(result)
    }
    res.status(201).json(result)
  } catch (error: any) {
    logger.error("Error creating modifier:", error)
    const msg = error?.message || "Invalid request"
    next(res.status(400).json({ error: msg }))
  }
}

export const updateModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.params
    const { rId } = req.body
    
    let result
    if (rId) {
      result = await modifiersService.updateModifierByRId(rId, req.body)
    } else if (modifierId) {
      result = await modifiersService.updateModifierById(modifierId, req.body)
    } else {
      return res.status(400).json({ error: "Either modifierId or rId is required" })
    }
    
    if ('error' in result) {
      return res.status(404).json(result)
    }
    
    res.json(result)
  } catch (error) {
    logger.error("Error updating modifier:", error)
    next(error)
  }
}

export const deleteModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.params
    const { rId } = req.body
    
    let result
    if (rId) {
      result = await modifiersService.deleteModifierByRId(rId)
    } else if (modifierId) {
      result = await modifiersService.deleteModifierById(modifierId)
    } else {
      return res.status(400).json({ error: "Either modifierId or rId is required" })
    }
    
    if ('error' in result) {
      return res.status(404).json(result)
    }
    
    res.json(result)
  } catch (error) {
    logger.error("Error deleting modifier:", error)
    next(error)
  }
}

export const batchCreateModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const result = await modifiersService.batchCreateModifiers({
      subDomain,
      localId,
      modifiers: req.body.modifiers || req.body
    })
    
    res.status(201).json(result)
  } catch (error) {
    logger.error("Error batch creating modifiers:", error)
    next(error)
  }
}

export const batchUpdateModif = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const result = await modifiersService.batchUpdateModifiers({
      subDomain,
      localId,
      modifiers: req.body.modifiers || req.body
    })
    
    res.json(result)
  } catch (error) {
    logger.error("Error batch updating modifiers:", error)
    next(error)
  }
}
