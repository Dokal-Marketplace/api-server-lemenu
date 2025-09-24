import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { Category } from "../models/Category"
import { CreateCategoryInput, UpdateCategoryInput } from "../types"


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
    const { subDomain, localId, includeInactive } = req.query as { subDomain?: string; localId?: string; includeInactive?: string }
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
    if (!input?.rId) {
      return res.status(400).json({ success: false, message: "rId is required" })
    }
    const updates: any = { ...input }
    delete updates.rId
    const category = await Category.findOneAndUpdate({ rId: input.rId }, updates, { new: true })
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
    const { rId } = req.query as { rId?: string }
    if (!rId) {
      return res.status(400).json({ success: false, message: "rId is required" })
    }
    const category = await Category.findOneAndUpdate({ rId }, { isActive: false }, { new: true })
    if (!category) return res.status(404).json({ success: false, message: "Category not found" })
    return res.status(200).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
}
  