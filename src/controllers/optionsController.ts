import { Request, Response, NextFunction } from "express"
import {
  getAllOptionsByLocation,
  getOptionsByModifier,
  getOptionsByModifierRId,
  getOptionById,
  createOption,
  updateOption,
  deleteOption,
  batchCreateOptions,
  batchUpdateOptions,
  batchDeleteOptions,
  searchOptions,
  getOptionsWithPagination
} from "../services/optionsService"

// Get all options for a location
export const getAllOptionsByLocationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    
    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "error",
        message: "subDomain and localId are required"
      })
    }

    const result = await getAllOptionsByLocation(subDomain, localId)

    res.status(200).json({
      type: "success",
      message: "Options retrieved successfully",
      data: result.options
    })
  } catch (error) {
    next(error)
  }
}

// Get options for a specific modifier
export const getOptionsByModifierController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.params
    
    if (!modifierId) {
      return res.status(400).json({
        type: "error",
        message: "modifierId is required"
      })
    }

    const result = await getOptionsByModifier(modifierId)
    
    if (result.error) {
      return res.status(404).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Options retrieved successfully",
      data: {
        options: result.options,
        modifier: result.modifier
      }
    })
  } catch (error) {
    next(error)
  }
}

// Get options by modifier rId
export const getOptionsByModifierRIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierRId } = req.params
    
    if (!modifierRId) {
      return res.status(400).json({
        type: "error",
        message: "modifierRId is required"
      })
    }

    const result = await getOptionsByModifierRId(modifierRId)
    
    if (result.error) {
      return res.status(404).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Options retrieved successfully",
      data: {
        options: result.options,
        modifier: result.modifier
      }
    })
  } catch (error) {
    next(error)
  }
}

// Get a specific option
export const getOptionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionId } = req.params
    
    if (!modifierId || !optionId) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and optionId are required"
      })
    }

    const result = await getOptionById(modifierId, optionId)
    
    if (result.error) {
      return res.status(404).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Option retrieved successfully",
      data: result.option
    })
  } catch (error) {
    next(error)
  }
}

// Create a new option
export const createOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionId, name, price, stock, isActive } = req.body
    
    if (!modifierId || !optionId || !name || price === undefined) {
      return res.status(400).json({
        type: "error",
        message: "modifierId, optionId, name, and price are required"
      })
    }

    const result = await createOption({
      modifierId,
      optionId,
      name,
      price,
      stock,
      isActive
    })
    
    if (result.error) {
      return res.status(400).json({
        type: "error",
        message: result.error
      })
    }

    res.status(201).json({
      type: "success",
      message: "Option created successfully",
      data: result.option
    })
  } catch (error) {
    next(error)
  }
}

// Update an option
export const updateOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionId } = req.params
    const updates = req.body
    
    if (!modifierId || !optionId) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and optionId are required"
      })
    }

    const result = await updateOption({
      modifierId,
      optionId,
      updates
    })
    
    if (result.error) {
      return res.status(404).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Option updated successfully",
      data: result.option
    })
  } catch (error) {
    next(error)
  }
}

// Delete an option
export const deleteOptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionId } = req.params
    
    if (!modifierId || !optionId) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and optionId are required"
      })
    }

    const result = await deleteOption(modifierId, optionId)
    
    if (result.error) {
      return res.status(404).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Option deleted successfully",
      data: result.option
    })
  } catch (error) {
    next(error)
  }
}

// Batch create options
export const batchCreateOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, options } = req.body
    
    if (!modifierId || !Array.isArray(options)) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and options array are required"
      })
    }

    const result = await batchCreateOptions({
      modifierId,
      options
    })
    
    if (result.error) {
      return res.status(400).json({
        type: "error",
        message: result.error
      })
    }

    res.status(201).json({
      type: "success",
      message: "Options created successfully",
      data: result.options
    })
  } catch (error) {
    next(error)
  }
}

// Batch update options
export const batchUpdateOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, options } = req.body
    
    if (!modifierId || !Array.isArray(options)) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and options array are required"
      })
    }

    const result = await batchUpdateOptions({
      modifierId,
      options
    })
    
    if (result.error) {
      return res.status(400).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Options updated successfully",
      data: {
        options: result.options,
        updatedCount: result.updatedCount,
        notFoundOptions: result.notFoundOptions
      }
    })
  } catch (error) {
    next(error)
  }
}

// Batch delete options
export const batchDeleteOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, optionIds } = req.body
    
    if (!modifierId || !Array.isArray(optionIds)) {
      return res.status(400).json({
        type: "error",
        message: "modifierId and optionIds array are required"
      })
    }

    const result = await batchDeleteOptions({
      modifierId,
      optionIds
    })
    
    if (result.error) {
      return res.status(400).json({
        type: "error",
        message: result.error
      })
    }

    res.status(200).json({
      type: "success",
      message: "Options deleted successfully",
      data: {
        options: result.options,
        deletedCount: result.deletedCount,
        notFoundOptions: result.notFoundOptions
      }
    })
  } catch (error) {
    next(error)
  }
}

// Search options
export const searchOptionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, modifierId, subDomain, localId, isActive } = req.query
    
    if (!q) {
      return res.status(400).json({
        type: "error",
        message: "Search query 'q' is required"
      })
    }

    const result = await searchOptions({
      query: q as string,
      modifierId: modifierId as string,
      subDomain: subDomain as string,
      localId: localId as string,
      isActive: isActive ? isActive === 'true' : undefined
    })

    res.status(200).json({
      type: "success",
      message: "Search completed successfully",
      data: result.options
    })
  } catch (error) {
    next(error)
  }
}

// Get options with pagination
export const getOptionsWithPaginationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId, subDomain, localId, page, limit, sort, isActive } = req.query

    const result = await getOptionsWithPagination({
      modifierId: modifierId as string,
      subDomain: subDomain as string,
      localId: localId as string,
      page: page as string,
      limit: limit as string,
      sort: sort as string,
      isActive: isActive ? isActive === 'true' : undefined
    })

    res.status(200).json({
      type: "success",
      message: "Options retrieved successfully",
      data: result.options,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}
  
  