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
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { catalogId } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        type: 'error',
        message: 'Product not found'
      });
    }

    // Sync product
    const result = await CatalogSyncService.syncProductToCatalog(product, catalogId);

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to sync product to catalog',
        data: {
          productId: result.productId,
          action: result.action,
          catalogId: result.catalogId
        }
      });
    }

    res.json({
      type: 'success',
      message: 'Product synced to catalog successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error syncing single product:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error while syncing product',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Batch sync all products to catalog
 * POST /api/v1/products/sync-to-catalog/:subDomain/:localId
 */
export const syncProductsToCatalog = async (
  req: Request,
  res: Response,
  _next: NextFunction
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
      return res.status(400).json({
        type: 'error',
        message: result.errors.length > 0 ? result.errors[0].error : 'Batch sync failed',
        data: {
          synced: result.synced,
          failed: result.failed,
          skipped: result.skipped,
          errors: result.errors
        }
      });
    }

    res.json({
      type: 'success',
      message: `Successfully synced ${result.synced} products to catalog`,
      data: result
    });
  } catch (error: any) {
    logger.error('Error in batch sync:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error during batch sync',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
  _next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { catalogId } = req.body;

    if (!productId) {
      return res.status(400).json({
        type: 'error',
        message: 'Product ID is required'
      });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        type: 'error',
        message: 'Product not found'
      });
    }

    // Sync availability
    const result = await CatalogSyncService.syncProductAvailability(product, catalogId);

    if (!result.success) {
      return res.status(400).json({
        type: 'error',
        message: result.error || 'Failed to sync product availability',
        data: {
          productId: result.productId,
          action: result.action,
          catalogId: result.catalogId
        }
      });
    }

    res.json({
      type: 'success',
      message: 'Product availability synced successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error syncing product availability:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'Internal server error while syncing availability',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
