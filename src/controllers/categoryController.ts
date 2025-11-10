import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { Category } from "../models/Category"
import { CreateCategoryInput, UpdateCategoryInput } from "../types"
import mongoose from "mongoose"


export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as CreateCategoryInput
    if (!input?.name || !input?.subDomain || !input?.localId) {
      return res.status(400).json({ success: false, message: "name, subDomain and localId are required" })
    }

    const rId = `${input.subDomain}:${input.localId}:cat:${Date.now()}`
    const category = await Category.create({
      rId,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      position: input.position ?? 0,
      subDomain: input.subDomain.toLowerCase(),
      localId: input.localId,
      isActive: true
    })

    return res.status(201).json({ success: true, data: category })
  } catch (error) {
    logger.error("Error creating category:", error)
    next(error)
  }
}
  
export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rId, id } = req.query as { rId?: string; id?: string }
    if (!rId && !id) {
      return res.status(400).json({ success: false, message: "rId or id is required" })
    }
    const category = await Category.findOne(rId ? { rId } : { _id: id })
    if (!category) return res.status(404).json({ success: false, message: "Category not found" })
    return res.status(200).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}


export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Support both query parameters and path parameters
    const subDomain = req.params.subDomain || req.query.subDomain as string
    const localId = req.params.localId || req.query.localId as string
    const { includeInactive } = req.query as { includeInactive?: string }
    
    if (!subDomain || !localId) {
      return res.status(400).json({ success: false, message: "subDomain and localId are required" })
    }
    const filter: any = { subDomain: String(subDomain).toLowerCase(), localId: String(localId) }
    if (!includeInactive) filter.isActive = true
    const categories = await Category.find(filter).sort({ position: 1, name: 1 })
    return res.status(200).json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
}
  

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const input = req.body as UpdateCategoryInput
    // Support both rId in body and categoryId in path parameters
    const categoryId = req.params.categoryId || input?.rId
    if (!categoryId) {
      return res.status(400).json({ success: false, message: "categoryId or rId is required" })
    }
    const updates: any = { ...input }
    delete updates.rId
    
    // Build query: if categoryId is a valid ObjectId, search by both _id and rId, otherwise only by rId
    const query: any = mongoose.isValidObjectId(categoryId)
      ? { $or: [{ _id: categoryId }, { rId: categoryId }] }
      : { rId: categoryId }
    
    const category = await Category.findOneAndUpdate(query, updates, { new: true })
    if (!category) return res.status(404).json({ success: false, message: "Category not found" })
    return res.status(200).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}
  

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Support both rId in query and categoryId in path parameters
    const categoryId = req.params.categoryId || req.query.rId as string
    if (!categoryId || categoryId === 'undefined') {
      return res.status(400).json({ success: false, message: "categoryId or rId is required" })
    }
    
    logger.info('Deleting category (hard delete)', { categoryId, rId: req.query.rId, params: req.params })
    
    // Check if category exists first
    const existingCategory = await Category.findOne({ rId: categoryId })
    if (!existingCategory) {
      logger.warn('Category not found for deletion', { categoryId, rId: req.query.rId })
      return res.status(404).json({ success: false, message: "Category not found" })
    }
    
    logger.info('Category found, proceeding with hard delete', { 
      categoryId, 
      existingRId: existingCategory.rId,
      categoryName: existingCategory.name
    })
    
    // Hard delete - permanently remove from database
    const deletedCategory = await Category.findOneAndDelete({ rId: categoryId })
    
    if (!deletedCategory) {
      logger.error('Failed to delete category', { categoryId })
      return res.status(500).json({ success: false, message: "Failed to delete category" })
    }
    
    logger.info('Category deleted successfully (hard delete)', { 
      categoryId, 
      categoryRId: deletedCategory.rId,
      categoryName: deletedCategory.name
    })
    return res.status(200).json({ success: true, message: "Category deleted successfully", data: deletedCategory })
  } catch (error) {
    logger.error('Error deleting category', { error, categoryId: req.params.categoryId || req.query.rId })
    next(error)
  }
}
  