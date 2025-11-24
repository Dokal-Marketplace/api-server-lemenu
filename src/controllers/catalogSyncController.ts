import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { CatalogSyncService } from '../services/catalog/catalogSyncService';
import { Product } from '../models/Product';

/**
 * Extract business context from request
 */
const getBusinessContext = (req: Request): { subDomain: string; localId?: string } => {
  // Priority 1: Route parameters
  if (req.params.subDomain) {
    return {
      subDomain: req.params.subDomain,
      localId: req.params.localId
    };
  }

  // Priority 2: Query parameters
  if (req.query.subDomain) {
    return {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string | undefined
    };
  }

  // Priority 3: Request body
  if (req.body.subDomain) {
    return {
      subDomain: req.body.subDomain,
      localId: req.body.localId
    };
  }

  throw new Error('Business context (subDomain) is required');
};

/**
 * Sync a single product to catalog
 * POST /api/v1/products/sync-product-to-catalog/:productId
 */
export const syncSingleProductToCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { catalogId } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: '3',
        message: 'Product ID is required'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        type: '3',
        message: 'Product not found'
      });
    }

    // Sync product
    const result = await CatalogSyncService.syncProductToCatalog(product, catalogId);

    if (!result.success) {
      return res.status(500).json({
        type: '3',
        message: `Failed to sync product: ${result.error}`,
        data: result
      });
    }

    res.json({
      type: '1',
      message: 'Product synced to catalog successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error syncing single product:', error);
    next(error);
  }
};

/**
 * Batch sync all products to catalog
 * POST /api/v1/products/sync-to-catalog/:subDomain/:localId
 */
export const syncProductsToCatalog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { catalogId } = req.body;

    logger.info('Starting batch product sync', { subDomain, localId, catalogId });

    const result = await CatalogSyncService.syncAllProductsToCatalog(
      subDomain,
      catalogId,
      localId
    );

    if (!result.success) {
      return res.status(500).json({
        type: '3',
        message: 'Batch sync failed',
        data: result
      });
    }

    res.json({
      type: '1',
      message: `Successfully synced ${result.synced} products to catalog`,
      data: result
    });
  } catch (error: any) {
    logger.error('Error in batch sync:', error);
    next(error);
  }
};

/**
 * Get catalog sync status for a business
 * GET /api/v1/products/sync-status/:subDomain/:localId
 */
export const getSyncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const status = await CatalogSyncService.getSyncStatus(subDomain, localId);

    res.json({
      type: '1',
      message: 'Sync status retrieved successfully',
      data: status
    });
  } catch (error: any) {
    logger.error('Error getting sync status:', error);
    next(error);
  }
};

/**
 * Sync product availability (stock update)
 * POST /api/v1/products/sync-availability/:productId
 */
export const syncProductAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { catalogId } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: '3',
        message: 'Product ID is required'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        type: '3',
        message: 'Product not found'
      });
    }

    // Sync availability
    const result = await CatalogSyncService.syncProductAvailability(product, catalogId);

    if (!result.success) {
      return res.status(500).json({
        type: '3',
        message: `Failed to sync product availability: ${result.error}`,
        data: result
      });
    }

    res.json({
      type: '1',
      message: 'Product availability synced successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error syncing product availability:', error);
    next(error);
  }
};
