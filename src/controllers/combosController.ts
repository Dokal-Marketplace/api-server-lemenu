import { Request, Response, NextFunction } from "express"
import { Combo } from "../models/Combo"
import logger from "../utils/logger"

// Interface for query parameters
interface ComboQueryParams {
  page?: string;
  limit?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  isActive?: string;
  tags?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const createCombo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const comboData = req.body;
    
    // Validate required fields
    if (!comboData.name || !comboData.price || !comboData.category) {
      res.status(400).json({
        success: false,
        message: "Name, price, and category are required"
      });
      return;
    }

    const combo = new Combo(comboData);
    const savedCombo = await combo.save();
    
    logger.info(`Combo created: ${savedCombo._id}`);
    res.status(201).json({ 
      success: true, 
      data: savedCombo,
      message: "Combo created successfully"
    });
  } catch (error) {
    logger.error("Error creating combo:", error);
    next(error);
  }
}

export const getCombo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Combo ID is required"
      });
      return;
    }

    const combo = await Combo.findById(id);
    
    if (!combo) {
      res.status(404).json({
        success: false,
        message: "Combo not found"
      });
      return;
    }

    res.json({ 
      success: true, 
      data: combo 
    });
  } catch (error) {
    logger.error("Error fetching combo:", error);
    next(error);
  }
}

export const getCombos = async (
  req: Request<{}, {}, {}, ComboQueryParams>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      minPrice,
      maxPrice,
      isActive,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [combos, totalCount] = await Promise.all([
      Combo.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Combo.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: combos,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    logger.error("Error fetching combos:", error);
    next(error);
  }
}

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Combo.distinct('category');
    
    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    logger.error("Error fetching categories:", error);
    next(error);
  }
}

export const updateCombo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Combo ID is required"
      });
      return;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;

    const combo = await Combo.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!combo) {
      res.status(404).json({
        success: false,
        message: "Combo not found"
      });
      return;
    }

    logger.info(`Combo updated: ${combo._id}`);
    res.json({ 
      success: true, 
      data: combo,
      message: "Combo updated successfully"
    });
  } catch (error) {
    logger.error("Error updating combo:", error);
    next(error);
  }
}

export const deleteCombo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Combo ID is required"
      });
      return;
    }

    const combo = await Combo.findByIdAndDelete(id);

    if (!combo) {
      res.status(404).json({
        success: false,
        message: "Combo not found"
      });
      return;
    }

    logger.info(`Combo deleted: ${id}`);
    res.json({ 
      success: true, 
      message: "Combo deleted successfully" 
    });
  } catch (error) {
    logger.error("Error deleting combo:", error);
    next(error);
  }
}

// Additional utility functions for advanced filtering
export const getComboStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await Combo.aggregate([
      {
        $group: {
          _id: null,
          totalCombos: { $sum: 1 },
          activeCombos: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const categoryStats = await Combo.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {},
        byCategory: categoryStats
      }
    });
  } catch (error) {
    logger.error("Error fetching combo stats:", error);
    next(error);
  }
}