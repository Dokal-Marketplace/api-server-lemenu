import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import * as ModifierItemsService from "../services/modifierItemsService"

export const createModifierItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionId, name, price, stock, isActive } = req.body

    if (!modifierId || !optionId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "modifierId, optionId, name, and price are required"
      })
    }

    logger.info(`Creating modifier item for modifier ${modifierId}`)
    const result = await ModifierItemsService.createModifierItem({
      modifierId,
      optionId,
      name,
      price,
      stock,
      isActive
    })

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.status(201).json({
      success: true,
      message: "Modifier item created successfully",
      data: result.option
    })
  } catch (error) {
    logger.error("Error creating modifier item:", error)
    next(error)
  }
}

export const updateModifierItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params
    const { modifierId, ...updates } = req.body

    if (!modifierId) {
      return res.status(400).json({
        success: false,
        message: "modifierId is required"
      })
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field to update is required"
      })
    }

    logger.info(`Updating modifier item ${itemId} for modifier ${modifierId}`)
    const result = await ModifierItemsService.updateModifierItem({
      modifierId,
      itemId,
      updates
    })

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      message: "Modifier item updated successfully",
      data: result.option
    })
  } catch (error) {
    logger.error("Error updating modifier item:", error)
    next(error)
  }
}

export const deleteModifierItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params
    const { modifierId } = req.body

    if (!modifierId) {
      return res.status(400).json({
        success: false,
        message: "modifierId is required"
      })
    }

    logger.info(`Deleting modifier item ${itemId} from modifier ${modifierId}`)
    const result = await ModifierItemsService.deleteModifierItem({
      modifierId,
      itemId
    })

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.status(204).json({
      success: true,
      message: "Modifier item deleted successfully"
    })
  } catch (error) {
    logger.error("Error deleting modifier item:", error)
    next(error)
  }
}

export const getModifierItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params
    const { modifierId } = req.query

    if (!modifierId) {
      return res.status(400).json({
        success: false,
        message: "modifierId query parameter is required"
      })
    }

    logger.info(`Getting modifier item ${itemId} from modifier ${modifierId}`)
    const result = await ModifierItemsService.getModifierItem({
      modifierId: modifierId as string,
      itemId
    })

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      message: "Modifier item retrieved successfully",
      data: result.option
    })
  } catch (error) {
    logger.error("Error getting modifier item:", error)
    next(error)
  }
}

export const getAllModifierItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.query

    if (!modifierId) {
      return res.status(400).json({
        success: false,
        message: "modifierId query parameter is required"
      })
    }

    logger.info(`Getting all modifier items for modifier ${modifierId}`)
    const result = await ModifierItemsService.getAllModifierItems(modifierId as string)

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      message: "Modifier items retrieved successfully",
      data: result.options
    })
  } catch (error) {
    logger.error("Error getting modifier items:", error)
    next(error)
  }
}

export const getModifierItemsByLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params

    logger.info(`Getting modifier items for ${subDomain}/${localId}`)
    const result = await ModifierItemsService.getModifierItemsBySubDomainAndLocal(
      subDomain,
      localId
    )

    res.json({
      success: true,
      message: "Modifier items retrieved successfully",
      data: result.options
    })
  } catch (error) {
    logger.error("Error getting modifier items by location:", error)
    next(error)
  }
}
