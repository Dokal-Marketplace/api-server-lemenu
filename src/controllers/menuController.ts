import { Request, Response, NextFunction } from "express"
import { Product } from "../models/Product"
import { Category } from "../models/Category"
import { Presentation } from "../models/Presentation"
import { Modifier } from "../models/Modifier"
import logger from "../utils/logger"

export const getProductInMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { localId, subDomain } = req.params
    const productIds = req.body as string[]

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Product IDs array is required" 
      })
    }

    // Get products with their details
    const products = await Product.find({
      _id: { $in: productIds },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    // Get categories for the products
    const categoryIds = [...new Set(products.map(p => p.categoryId))]
    const categories = await Category.find({
      rId: { $in: categoryIds },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    // Get presentations for the products
    const productIds_str = products.map(p => p._id.toString())
    const presentations = await Presentation.find({
      productId: { $in: productIds_str },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    // Get modifiers for the products
    const modifiers = await Modifier.find({
      localsId: { $in: [localId] },
      subDomain: subDomain.toLowerCase(),
      isActive: true
    }).lean()

    // Combine the data
    const result = products.map(product => ({
      ...product,
      category: categories.find(c => c.rId === product.categoryId),
      presentations: presentations.filter(p => p.productId === product._id.toString()),
      modifiers: modifiers.filter(m => 
        product.modifiers?.some((pm: any) => pm.id === m.rId)
      )
    }))

    res.json({ 
      success: true, 
      message: "Product details retrieved successfully",
      data: result 
    })
  } catch (error) {
    logger.error("Error getting product details in menu:", error)
    next(error)
  }
}
  