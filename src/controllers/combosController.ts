import { Request, Response, NextFunction } from "express"
import { Combo } from "../models/Combo"
import { BusinessLocation } from "../models/BusinessLocation"
import { validationResult } from "express-validator"
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

// Interface for business context
interface BusinessContext {
  subDomain: string;
  localId: string;
}

export const createCombo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
      return;
    }

    const { subDomain, localId } = req.params as unknown as BusinessContext;
    const comboData = req.body;

    // Verify business context exists
    const businessLocation = await BusinessLocation.findOne({ 
      subDomain, 
      _id: localId, 
      isActive: true 
    });

    if (!businessLocation) {
      res.status(404).json({
        success: false,
        message: "Business location not found or inactive"
      });
      return;
    }

    // Add business context to combo data
    const comboWithContext = {
      ...comboData,
      subDomain,
      localId
    };

    const combo = new Combo(comboWithContext);
    const savedCombo = await combo.save();
    
    logger.info(`Combo created: ${savedCombo._id} for ${subDomain}/${localId}`);
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
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
      return;
    }

    const { id, subDomain, localId } = req.params;

    // Build query with business context
    const query: any = { _id: id };
    if (subDomain && localId) {
      query.subDomain = subDomain;
      query.localId = localId;
    }

    const combo = await Combo.findOne(query);
    
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
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
      return;
    }

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

    const { subDomain, localId } = req.params as unknown as BusinessContext;

    // Build filter object with business context
    const filter: any = {};
    
    // Always include business context if provided
    if (subDomain && localId) {
      filter.subDomain = subDomain;
      filter.localId = localId;
    }

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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subDomain, localId } = req.params as unknown as BusinessContext;

    // Build query with business context
    const query: any = {};
    if (subDomain && localId) {
      query.subDomain = subDomain;
      query.localId = localId;
    }

    const categories = await Combo.distinct('category', query);
    
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
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
      return;
    }

    const { id, subDomain, localId } = req.params;
    const updateData = req.body;

    // Build query with business context
    const query: any = { _id: id };
    if (subDomain && localId) {
      query.subDomain = subDomain;
      query.localId = localId;
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.subDomain;
    delete updateData.localId;

    const combo = await Combo.findOneAndUpdate(
      query,
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
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
      return;
    }

    const { id, subDomain, localId } = req.params;

    // Build query with business context
    const query: any = { _id: id };
    if (subDomain && localId) {
      query.subDomain = subDomain;
      query.localId = localId;
    }

    const combo = await Combo.findOneAndDelete(query);

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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subDomain, localId } = req.params as unknown as BusinessContext;

    // Build match stage with business context
    const matchStage: any = {};
    if (subDomain && localId) {
      matchStage.subDomain = subDomain;
      matchStage.localId = localId;
    }

    const stats = await Combo.aggregate([
      { $match: matchStage },
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
      { $match: matchStage },
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