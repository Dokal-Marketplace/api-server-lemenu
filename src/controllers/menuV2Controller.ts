import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { getExampleData } from "../services/exampleService"



export const batchUpdateProducts = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
export const getCategory = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getExampleData()
    logger.warn("REMEMBER: Remove home page")
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}





export const getIntegration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subDomain, localId } = req.params

      // Get business for this subdomain and localId
      const { Business } = await import("../models/Business")
      const business = await Business.findOne({
        subDomain: subDomain.toLowerCase(),
        localId,
        isActive: true
      }).lean()

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found for this subdomain and localId"
        })
      }

      // Get local details
      const { BusinessLocation } = await import("../models/BusinessLocation")
      const local = await BusinessLocation.findOne({
        subDomain: subDomain.toLowerCase(),
        localId,
        isActive: true
      }).lean()

      // Get categories for this specific local
      const { Category } = await import("../models/Category")
      const categories = await Category.find({
        subDomain: subDomain.toLowerCase(),
        localId,
        isActive: true
      }).lean()

      // Get products for this specific local
      const { Product } = await import("../models/Product")
      const products = await Product.find({
        subDomain: subDomain.toLowerCase(),
        localId,
        isActive: true
      }).lean()

      // Get presentations for this specific local
      const { Presentation } = await import("../models/Presentation")
      const presentations = await Presentation.find({
        subDomain: subDomain.toLowerCase(),
        localId,
        isActive: true
      }).lean()

      // Get modifiers for this specific local
      const { Modifier } = await import("../models/Modifier")
      const modifiers = await Modifier.find({
        subDomain: subDomain.toLowerCase(),
        localsId: { $in: [localId] },
        isActive: true
      }).lean()

      const integrationData = {
        subDomain,
        localId,
        business,
        local,
        categories,
        products,
        presentations,
        modifiers,
        lastUpdated: new Date(),
        version: "1.0"
      }

      res.json({
        success: true,
        message: "Menu integration data for local retrieved successfully",
        data: integrationData
      })
    } catch (error) {
      logger.error("Error getting menu integration for local:", error)
      next(error)
    }
  }
  
export const batchUpdateCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getExampleData()
    logger.warn("REMEMBER: Remove home page")
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}




export const downloadMenuFile = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
export const batchUpdateOptions = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getExampleData()
    logger.warn("REMEMBER: Remove home page")
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
}



export const batchUpdateUpdates = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
  
  export const batchUpdateV2Products = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  export const getIntegrationV2 = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subDomain } = req.params

      // Get all businesses for this subdomain
      const { Business } = await import("../models/Business")
      const businesses = await Business.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      if (businesses.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No businesses found for this subdomain"
        })
      }

      // Get all locals for this subdomain
      const { BusinessLocation } = await import("../models/BusinessLocation")
      const locals = await BusinessLocation.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      // Get all categories for this subdomain
      const { Category } = await import("../models/Category")
      const categories = await Category.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      // Get all products for this subdomain
      const { Product } = await import("../models/Product")
      const products = await Product.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      // Get all presentations for this subdomain
      const { Presentation } = await import("../models/Presentation")
      const presentations = await Presentation.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      // Get all modifiers for this subdomain
      const { Modifier } = await import("../models/Modifier")
      const modifiers = await Modifier.find({
        subDomain: subDomain.toLowerCase(),
        isActive: true
      }).lean()

      const integrationData = {
        subDomain,
        businesses,
        locals,
        categories,
        products,
        presentations,
        modifiers,
        lastUpdated: new Date(),
        version: "2.0"
      }

      res.json({
        success: true,
        message: "Menu integration data retrieved successfully",
        data: integrationData
      })
    } catch (error) {
      logger.error("Error getting menu integration v2:", error)
      next(error)
    }
  }

  export const updateBatchBusinessLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { itemType, rId } = req.params
      const items = req.body as any[]

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items array is required"
        })
      }

      let updatedItems = []
      let Model: any

      // Determine which model to use based on itemType
      switch (itemType.toLowerCase()) {
        case 'productos':
        case 'products':
          const { Product } = await import("../models/Product")
          Model = Product
          break
        case 'categorias':
        case 'categories':
          const { Category } = await import("../models/Category")
          Model = Category
          break
        case 'modificadores':
        case 'modifiers':
          const { Modifier } = await import("../models/Modifier")
          Model = Modifier
          break
        case 'presentaciones':
        case 'presentations':
          const { Presentation } = await import("../models/Presentation")
          Model = Presentation
          break
        case 'opciones':
        case 'options':
          // Assuming options are part of modifiers or a separate model
          const { Modifier: ModifierModel } = await import("../models/Modifier")
          Model = ModifierModel
          break
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid item type. Supported types: productos, categorias, modificadores, presentaciones, opciones"
          })
      }

      // Update each item
      for (const item of items) {
        try {
          const updateData = { ...item }
          delete updateData._id // Remove _id from update data
          
          const updatedItem = await Model.findOneAndUpdate(
            { rId: item.rId || item.id },
            { $set: updateData },
            { new: true, upsert: false }
          )
          
          if (updatedItem) {
            updatedItems.push(updatedItem)
          }
        } catch (itemError) {
          logger.error(`Error updating item ${item.rId || item.id}:`, itemError)
          // Continue with other items even if one fails
        }
      }

      res.json({
        success: true,
        message: `Items updated successfully`,
        data: {
          itemType,
          rId,
          updatedCount: updatedItems.length,
          totalItems: items.length,
          updatedItems
        }
      })
    } catch (error) {
      logger.error("Error updating multiple local items:", error)
      next(error)
    }
  }


  export const getBotStructure = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await getExampleData()
      logger.warn("REMEMBER: Remove home page")
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }