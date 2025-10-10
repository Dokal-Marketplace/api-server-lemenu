import { Request, Response, NextFunction } from "express"
import {
  createOption,
  listOptions,
  getOptionById,
  getOptionByRId,
  updateOptionById,
  deleteOptionById,
  batchDeleteOptionsByRIds,
  toggleOptionActive,
  updateOptionStock,
  getOptionsByCategory,
  getOptionsByModifier,
  createMultipleOptions
} from "../services/optionsService"
import logger from "../utils/logger"

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId, category, modifierId, isActive, q, page, limit, sort, minPrice, maxPrice } = req.query;

    const result = await listOptions({
      subDomain: subDomain as string,
      localId: localId as string,
      category: category as string,
      modifierId: modifierId as string,
      isActive: isActive ? isActive === 'true' : undefined,
      q: q as string,
      page: page as string,
      limit: limit as string,
      sort: sort as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error("Error getting all options", { error, query: req.query });
    next(error);
  }
}

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const payload = req.body;

    if (!subDomain || !localId) {
      return res.status(400).json({
        success: false,
        message: "subDomain and localId are required"
      });
    }

    const result = await createOption({
      subDomain,
      localId,
      payload
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: "Option created successfully",
      data: result.option
    });
  } catch (error) {
    logger.error("Error creating option", { error, body: req.body });
    next(error);
  }
}

export const deleteOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "Option ID is required"
      });
    }

    const result = await deleteOptionById(optionId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: "Option deleted successfully",
      data: result.deleted
    });
  } catch (error) {
    logger.error("Error deleting option", { error, optionId: req.params.optionId });
    next(error);
  }
}

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { optionId } = req.params;
    const updateData = req.body;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "Option ID is required"
      });
    }

    const result = await updateOptionById(optionId, updateData);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: "Option updated successfully",
      data: result.option
    });
  } catch (error) {
    logger.error("Error updating option", { error, optionId: req.params.optionId, body: req.body });
    next(error);
  }
}

export const createMultipleBusinessLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const { options } = req.body;

    if (!subDomain || !localId) {
      return res.status(400).json({
        success: false,
        message: "subDomain and localId are required"
      });
    }

    if (!Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: "Options must be an array"
      });
    }

    const result = await createMultipleOptions({
      subDomain,
      localId,
      options
    });

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: "Multiple options created successfully",
      data: {
        options: result.options,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error("Error creating multiple options", { error, body: req.body });
    next(error);
  }
}

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "Option ID is required"
      });
    }

    const result = await getOptionById(optionId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.option
    });
  } catch (error) {
    logger.error("Error getting option by ID", { error, optionId: req.params.optionId });
    next(error);
  }
}

export const getByRId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rId } = req.params;

    if (!rId) {
      return res.status(400).json({
        success: false,
        message: "Option rId is required"
      });
    }

    const result = await getOptionByRId(rId);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.option
    });
  } catch (error) {
    logger.error("Error getting option by rId", { error, rId: req.params.rId });
    next(error);
  }
}

export const toggleActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "Option ID is required"
      });
    }

    const result = await toggleOptionActive(optionId);

    if (result.error || !result.option) {
      return res.status(404).json({
        success: false,
        message: result.error || "Option not found"
      });
    }

    res.json({
      success: true,
      message: `Option ${result.option.isActive ? 'activated' : 'deactivated'} successfully`,
      data: result.option
    });
  } catch (error) {
    logger.error("Error toggling option active status", { error, optionId: req.params.optionId });
    next(error);
  }
}

export const updateStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { optionId } = req.params;
    const { stock } = req.body;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "Option ID is required"
      });
    }

    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative number"
      });
    }

    const result = await updateOptionStock(optionId, stock);

    if (result.error) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: "Option stock updated successfully",
      data: result.option
    });
  } catch (error) {
    logger.error("Error updating option stock", { error, optionId: req.params.optionId, body: req.body });
    next(error);
  }
}

export const getByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const { subDomain, localId } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    const result = await getOptionsByCategory(
      category,
      subDomain as string,
      localId as string
    );

    res.json({
      success: true,
      data: result.options
    });
  } catch (error) {
    logger.error("Error getting options by category", { error, category: req.params.category });
    next(error);
  }
}

export const getByModifier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { modifierId } = req.params;

    if (!modifierId) {
      return res.status(400).json({
        success: false,
        message: "Modifier ID is required"
      });
    }

    const result = await getOptionsByModifier(modifierId);

    res.json({
      success: true,
      data: result.options
    });
  } catch (error) {
    logger.error("Error getting options by modifier", { error, modifierId: req.params.modifierId });
    next(error);
  }
}

export const batchDelete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rIds } = req.body;

    if (!Array.isArray(rIds) || rIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rIds must be a non-empty array"
      });
    }

    const result = await batchDeleteOptionsByRIds(rIds);

    res.json({
      success: true,
      message: `${result.deletedCount} options deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error("Error batch deleting options", { error, body: req.body });
    next(error);
  }
}
  