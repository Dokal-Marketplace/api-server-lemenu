import { Request, Response, NextFunction } from "express"
import { Types } from "mongoose"
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
    const { subDomain, localId } = req.params
    const productIds = req.body as string[]

    // Validation
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Product IDs array is required" 
      })
    }

    // FIX 1: Properly type the ObjectId array and filter out nulls
    const objectIds = productIds
      .map(id => {
        try {
          return new Types.ObjectId(id)
        } catch (error) {
          logger.warn(`Invalid ObjectId format: ${id}`)
          return null
        }
      })
      .filter((id): id is Types.ObjectId => id !== null)

    if (objectIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No valid product IDs provided" 
      })
    }

    // Debug logging
    logger.info(`Searching for products with:`, {
      objectIds: objectIds.map(id => id.toString()),
      subDomain: subDomain,
      localId,
      originalProductIds: productIds
    })

    // Get products with their details
    const products = await Product.find({
      _id: { $in: objectIds },
      subDomain: subDomain,
      localId,
      isActive: true
    }).lean()

    logger.info(`Found ${products.length} products matching criteria`)

    // If no products found, try a broader search to debug
    if (products.length === 0) {
      const allProductsWithIds = await Product.find({
        _id: { $in: objectIds }
      }).lean()
      
      logger.error(`❌ MISMATCH DETECTED - Products found by ID only: ${allProductsWithIds.length}`, {
        expectedCriteria: {
          subDomain: subDomain,
          subDomainType: typeof subDomain,
          localId: localId,
          localIdType: typeof localId,
          isActive: true
        },
        foundProducts: allProductsWithIds.map(p => ({
          _id: p._id,
          subDomain: p.subDomain,
          subDomainMatch: p.subDomain === subDomain,
          subDomainType: typeof p.subDomain,
          localId: p.localId,
          localIdMatch: p.localId === localId,
          localIdType: typeof p.localId,
          isActive: p.isActive,
          isActiveMatch: p.isActive === true
        }))
      })
      
      // Try each filter individually to identify the culprit
      const bySubDomain = await Product.countDocuments({ _id: { $in: objectIds }, subDomain })
      const byLocalId = await Product.countDocuments({ _id: { $in: objectIds }, localId })
      const byIsActive = await Product.countDocuments({ _id: { $in: objectIds }, isActive: true })
      
      logger.error('Individual filter results:', {
        bySubDomain,
        byLocalId,
        byIsActive,
        allThreeFilters: products.length
      })
    }

    // Get categories for the products
    const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))]
    const categories = await Category.find({
      rId: { $in: categoryIds },
      subDomain: subDomain,
      localId,
      isActive: true
    }).lean()

    // FIX 2: Use consistent ID comparison (ObjectId vs string)
    const productIdsForQuery = products.map(p => p._id.toString())
    const presentations = await Presentation.find({
      productId: { $in: productIdsForQuery },
      subDomain: subDomain,
      localId,
      isActive: true
    }).lean()

    // Get modifiers for the products
    const modifiers = await Modifier.find({
      localsId: { $in: [localId] },
      subDomain: subDomain,
      isActive: true
    }).lean()

    // FIX 3: Properly handle the product modifiers structure
    const result = products.map(product => {
      const productIdStr = product._id.toString()
      const productModifierIds = Array.isArray(product.modifiers) 
        ? product.modifiers.map((pm: any) => pm.id).filter(Boolean)
        : []

      return {
        ...product,
        category: categories.find(c => c.rId === product.categoryId) || null,
        presentations: presentations.filter(p => p.productId === productIdStr),
        modifiers: modifiers.filter(m => productModifierIds.includes(m.rId))
      }
    })

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