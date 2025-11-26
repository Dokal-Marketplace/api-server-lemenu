import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import {
  listProductsByLocation,
  listProducts,
  getProductById as svcGetProductById,
  createProductForLocation,
  createProductWithPresentations,
  updateProductById,
  deleteProductById,
  batchDeleteByRids,
  convertProductToModifier
} from "../services/productService"
import { CatalogSyncService } from "../services/catalog/catalogSyncService"
import { Business } from "../models/Business"

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params as { subDomain: string; localId: string }
    const products = await listProductsByLocation(subDomain, localId)
    res.status(200).json({ type: "success", message: "Products retrieved", data: products })
  } catch (error) {
    logger.error("Error fetching products by location", { error })
    next(error)
  }
}


export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params as { productId: string }
    const product = await svcGetProductById(productId)
    if (!product) {
      res.status(404).json({ type: "error", message: "Product not found" })
      return
    }
    res.status(200).json({ type: "success", message: "Product retrieved", data: product })
  } catch (error) {
    logger.error("Error fetching product", { error })
    next(error)
  }
}

// Not used here; left for compatibility if wired elsewhere
export const getCompanies = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(200).json({ type: "success", message: "OK" })
}


export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params as { productId: string }
    const update = req.body || {}
    const { product, error } = await updateProductById(productId, update)
    if (error) {
      res.status(400).json({ type: "error", message: error })
      return
    }
    if (!product) {
      res.status(404).json({ type: "error", message: "Product not found" })
      return
    }

    // Auto-sync to catalog if enabled (realtime mode)
    const business = await Business.findOne({ subDomain: product.subDomain })
    if (business?.catalogSyncEnabled && business?.catalogSyncSchedule === 'realtime' && business?.fbCatalogIds?.[0]) {
      // Sync in background - don't block response
      CatalogSyncService.syncProductToCatalog(product, business.fbCatalogIds[0])
        .then(syncResult => {
          if (syncResult.success) {
            logger.info('Product update auto-synced to catalog', {
              productId: product.rId,
              catalogId: syncResult.catalogId
            })
          }
        })
        .catch(err => logger.error('Background catalog sync failed:', err))
    }

    res.status(200).json({ type: "success", message: "Product updated", data: product })
  } catch (error) {
    logger.error("Error updating product", { error })
    next(error)
  }
}

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params as { productId: string }

    // Get product before deleting (for catalog sync)
    const product = await svcGetProductById(productId)

    const { deleted } = await deleteProductById(productId)
    if (!deleted) {
      res.status(404).json({ type: "error", message: "Product not found" })
      return
    }

    // Auto-remove from catalog if enabled
    if (product) {
      const business = await Business.findOne({ subDomain: product.subDomain })
      if (business?.catalogSyncEnabled && business?.fbCatalogIds?.[0]) {
        // Remove in background - don't block response
        CatalogSyncService.removeProductFromCatalog(
          product.rId,
          product.subDomain,
          business.fbCatalogIds[0],
          product.localId
        )
          .then(syncResult => {
            if (syncResult.success) {
              logger.info('Product auto-removed from catalog', {
                productId: product.rId,
                catalogId: syncResult.catalogId
              })
            }
          })
          .catch(err => logger.error('Background catalog removal failed:', err))
      }
    }

    res.status(204).send()
  } catch (error) {
    logger.error("Error deleting product", { error })
    next(error)
  }
}



export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId, categoryId, q, page, limit, sort } = req.query as Record<string, string>
    const result = await listProducts({ subDomain, localId, categoryId, q, page, limit, sort })
    res.status(200).json({ type: "success", message: "Products retrieved", data: result.items, pagination: result.pagination })
  } catch (error) {
    logger.error("Error listing products", { error })
    next(error)
  }
}




export const batchDeleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rIds } = req.body as { rIds: string[] }
    if (!Array.isArray(rIds) || rIds.length === 0) {
      res.status(400).json({ type: "error", message: "rIds array required" })
      return
    }
    const result = await batchDeleteByRids(rIds)
    res.status(200).json({ type: "success", message: "Products deleted", data: result })
  } catch (error) {
    logger.error("Error batch deleting products", { error })
    next(error)
  }
}



export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params as { subDomain: string; localId: string }
    const payload = req.body as any

    const result = await createProductForLocation({ subDomain, localId, payload })
    if ("error" in result) {
      res.status(400).json({ type: "error", message: result.error })
      return
    }

    // Auto-sync to catalog if enabled (realtime mode)
    const business = await Business.findOne({ subDomain })
    if (business?.catalogSyncEnabled && business?.catalogSyncSchedule === 'realtime' && business?.fbCatalogIds?.[0]) {
      // Sync in background - don't block response
      CatalogSyncService.syncProductToCatalog(result.product, business.fbCatalogIds[0])
        .then(syncResult => {
          if (syncResult.success) {
            logger.info('Product auto-synced to catalog', {
              productId: result.product.rId,
              catalogId: syncResult.catalogId
            })
          }
        })
        .catch(err => logger.error('Background catalog sync failed:', err))
    }

    res.status(201).json({ type: "success", message: "Product created", data: result.product })
  } catch (error) {
    logger.error("Error creating product", { error })
    next(error)
  }
}


export const convertToModifier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = (req.body || {}) as { productId: string }
    if (!productId) {
      res.status(400).json({ type: "error", message: "productId is required" })
      return
    }
    const { modifier, error } = await convertProductToModifier(productId)
    if (error) {
      res.status(404).json({ type: "error", message: error })
      return
    }
    res.status(200).json({ type: "success", message: "Product converted to modifier", data: modifier })
  } catch (error) {
    logger.error("Error converting product to modifier", { error })
    next(error)
  }
}


export const batchCreateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params as { subDomain: string; localId: string }
    const body = req.body as any
    const { product, presentations } = body as { product: any; presentations: any[] }
    if (!product || !Array.isArray(presentations)) {
      res.status(400).json({ type: "error", message: "product and presentations are required" })
      return
    }
    const result = await createProductWithPresentations({ subDomain, localId, product, presentations })
    if ("error" in result) {
      res.status(400).json({ type: "error", message: result.error })
      return
    }
    res.status(201).json({ type: "success", message: "Product with presentations created", data: result })
  } catch (error) {
    logger.error("Error creating product with presentations", { error })
    next(error)
  }
}
