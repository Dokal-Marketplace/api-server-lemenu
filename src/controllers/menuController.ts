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
    const { subDomain, localId } = req.params
    const productIds = req.body as string[]

    // Validation
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required"
      })
    }

    if (!subDomain || !localId) {
      return res.status(400).json({
        success: false,
        message: "subDomain and localId are required"
      })
    }

    logger.info(`Getting product details for menu:`, {
      productIds,
      subDomain,
      localId
    })

    // Get products by rId (not MongoDB _id)
    const products = await Product.find({
      rId: { $in: productIds },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    if (products.length === 0) {
      return res.json({
        success: true,
        message: "No products found",
        data: []
      })
    }

    logger.info(`Found ${products.length} products`)

    // Get categories for the products
    const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))]
    const categories = await Category.find({
      rId: { $in: categoryIds },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    // Get presentations using product rId
    const productRIds = products.map(p => p.rId)
    const presentations = await Presentation.find({
      productId: { $in: productRIds },
      subDomain: subDomain.toLowerCase(),
      localId,
      isActive: true
    }).lean()

    // Get modifiers for this location
    const modifiers = await Modifier.find({
      localsId: { $in: [localId] },
      subDomain: subDomain.toLowerCase(),
      isActive: true
    }).lean()

    // Build the response with proper structure for chatbot
    const result = products.map(product => {
      const productModifierIds = Array.isArray(product.modifiers)
        ? product.modifiers.map((pm: any) => pm.id).filter(Boolean)
        : []

      const productCategory = categories.find(c => c.rId === product.categoryId)
      const productPresentations = presentations.filter(p => p.productId === product.rId)
      const productModifiers = modifiers.filter(m => productModifierIds.includes(m.rId))

      return {
        _id: product.rId,
        name: product.name,
        description: product.description || "",
        price: product.basePrice,
        imageUrl: product.imageUrl || "",
        isAvailable: product.isAvailable && !product.isOutOfStock,
        preparationTime: product.preparationTime || 0,
        category: productCategory ? {
          _id: productCategory.rId,
          name: productCategory.name
        } : null,
        presentations: productPresentations.map(pres => ({
          _id: pres.rId,
          name: pres.name,
          price: pres.price,
          amountWithDiscount: pres.amountWithDiscount,
          isAvailable: pres.isAvailable,
          isPromotion: pres.isPromotion || false
        })),
        modifiers: productModifiers.map(mod => ({
          _id: mod.rId,
          name: mod.name,
          minSelections: mod.minQuantity,
          maxSelections: mod.maxQuantity,
          isMultiple: mod.isMultiple,
          options: mod.options
            .filter(opt => opt.isActive !== false)
            .map(opt => ({
              _id: opt.optionId,
              name: opt.name,
              price: opt.price
            }))
        }))
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