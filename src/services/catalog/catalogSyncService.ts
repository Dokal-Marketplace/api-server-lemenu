import { IProduct } from '../../models/Product';
import { Business } from '../../models/Business';
import logger from '../../utils/logger';
import { MetaCatalogService, CreateProductParams, BatchProductOperation } from '../whatsapp/metaCatalogService';

/**
 * Catalog Sync Service
 * Synchronizes internal restaurant products with Facebook Catalog for WhatsApp integration
 *
 * Architecture:
 * - Internal Products (MongoDB) = Master (Source of Truth)
 * - Facebook Catalog (Meta API) = Slave (WhatsApp Display)
 */

export interface SyncResult {
  success: boolean;
  productId?: string;
  catalogId?: string;
  action?: 'create' | 'update' | 'delete' | 'skip';
  error?: string;
}

export interface BatchSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

export class CatalogSyncService {
  /**
   * Get primary catalog ID for a business
   */
  private static async getPrimaryCatalogId(
    subDomain: string,
    _localId?: string
  ): Promise<string | null> {
    try {
      const business = await Business.findOne({ subDomain });

      if (!business) {
        logger.error('Business not found for catalog sync', { subDomain });
        return null;
      }

      // Check if catalog sync is enabled
      if (business.catalogSyncEnabled === false) {
        logger.info('Catalog sync is disabled for business', { subDomain });
        return null;
      }

      // Get primary catalog ID
      const catalogId = business.fbCatalogIds?.[0];

      if (!catalogId) {
        logger.warn('No catalog ID configured for business', { subDomain });
        return null;
      }

      return catalogId;
    } catch (error: any) {
      logger.error('Error getting primary catalog ID:', error);
      return null;
    }
  }

  /**
   * Map internal product to Facebook Catalog format
   */
  private static mapProductToCatalogFormat(product: IProduct): CreateProductParams {
    // Determine availability
    let availability: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued';

    if (!product.isActive) {
      availability = 'discontinued';
    } else if (product.isOutOfStock) {
      availability = 'out of stock';
    } else if (product.isAvailable) {
      availability = 'in stock';
    } else {
      availability = 'available for order';
    }

    // Build catalog product
    const catalogProduct: CreateProductParams = {
      retailer_id: product.rId,
      name: product.name,
      price: product.basePrice,
      currency: 'PEN', // Default currency - can be made configurable
      availability,
      condition: 'new',
    };

    // Add optional fields if available
    if (product.description) {
      catalogProduct.description = product.description;
    }

    if (product.imageUrl) {
      catalogProduct.image_url = product.imageUrl;
    }

    if (product.category) {
      catalogProduct.category = product.category;
    }

    // You can add brand from business config if needed
    catalogProduct.brand = 'LeMenu';

    return catalogProduct;
  }

  /**
   * Check if product exists in catalog
   */
  private static async checkProductExists(
    catalogId: string,
    retailerId: string,
    subDomain: string,
    localId?: string
  ): Promise<boolean> {
    try {
      await MetaCatalogService.getProduct(catalogId, retailerId, subDomain, localId);
      return true;
    } catch (error) {
      // Product doesn't exist if we get an error
      return false;
    }
  }

  /**
   * Sync a single product to Facebook Catalog
   * Called automatically when product is created/updated
   */
  static async syncProductToCatalog(
    product: IProduct,
    catalogId?: string
  ): Promise<SyncResult> {
    try {
      // Get catalog ID if not provided
      const targetCatalogId = catalogId || await this.getPrimaryCatalogId(product.subDomain, product.localId);

      if (!targetCatalogId) {
        return {
          success: false,
          productId: product.rId,
          action: 'skip',
          error: 'No catalog configured or sync disabled'
        };
      }

      // Skip if product is not active or not available (unless marking as out of stock)
      if (!product.isActive && !product.isOutOfStock) {
        logger.info('Skipping sync for inactive product', { productId: product.rId });
        return {
          success: true,
          productId: product.rId,
          catalogId: targetCatalogId,
          action: 'skip'
        };
      }

      // Map product to catalog format
      const catalogProduct = this.mapProductToCatalogFormat(product);

      // Check if product exists in catalog
      const exists = await this.checkProductExists(
        targetCatalogId,
        product.rId,
        product.subDomain,
        product.localId
      );

      if (exists) {
        // Update existing product
        await MetaCatalogService.updateProduct(
          targetCatalogId,
          product.rId,
          catalogProduct,
          product.subDomain,
          product.localId
        );

        logger.info('Product updated in catalog', {
          productId: product.rId,
          catalogId: targetCatalogId,
          subDomain: product.subDomain
        });

        return {
          success: true,
          productId: product.rId,
          catalogId: targetCatalogId,
          action: 'update'
        };
      } else {
        // Create new product
        await MetaCatalogService.createProduct(
          targetCatalogId,
          catalogProduct,
          product.subDomain,
          product.localId
        );

        logger.info('Product created in catalog', {
          productId: product.rId,
          catalogId: targetCatalogId,
          subDomain: product.subDomain
        });

        return {
          success: true,
          productId: product.rId,
          catalogId: targetCatalogId,
          action: 'create'
        };
      }
    } catch (error: any) {
      logger.error('Error syncing product to catalog:', {
        productId: product.rId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        productId: product.rId,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Batch sync all products to catalog
   * Useful for initial setup or manual sync
   */
  static async syncAllProductsToCatalog(
    subDomain: string,
    catalogId?: string,
    localId?: string
  ): Promise<BatchSyncResult> {
    try {
      const { Product } = await import('../../models/Product');

      // Get catalog ID
      const targetCatalogId = catalogId || await this.getPrimaryCatalogId(subDomain, localId);

      if (!targetCatalogId) {
        return {
          success: false,
          synced: 0,
          failed: 0,
          skipped: 0,
          errors: [{
            productId: 'batch',
            error: 'No catalog configured or sync disabled'
          }]
        };
      }

      // Get all products for this business
      const query: any = {
        subDomain,
        isActive: true,
      };

      if (localId) {
        query.localId = localId;
      }

      const products = await Product.find(query);

      if (products.length === 0) {
        logger.info('No products found to sync', { subDomain, localId });
        return {
          success: true,
          synced: 0,
          failed: 0,
          skipped: 0,
          errors: []
        };
      }

      logger.info('Starting batch product sync', {
        subDomain,
        catalogId: targetCatalogId,
        productCount: products.length
      });

      // Prepare batch operations
      const operations: BatchProductOperation[] = products.map(product => {
        const catalogProduct = this.mapProductToCatalogFormat(product);

        return {
          method: 'CREATE',
          retailer_id: product.rId,
          data: catalogProduct
        };
      });

      // Execute batch sync
      const result = await MetaCatalogService.batchProductOperations(
        targetCatalogId,
        operations,
        subDomain,
        localId
      );

      logger.info('Batch sync completed', {
        subDomain,
        catalogId: targetCatalogId,
        totalProducts: products.length,
        result
      });

      return {
        success: true,
        synced: products.length,
        failed: 0,
        skipped: 0,
        errors: []
      };
    } catch (error: any) {
      logger.error('Error in batch sync:', {
        subDomain,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        synced: 0,
        failed: 0,
        skipped: 0,
        errors: [{
          productId: 'batch',
          error: error.message || 'Unknown error'
        }]
      };
    }
  }

  /**
   * Remove product from catalog when deleted
   */
  static async removeProductFromCatalog(
    productRId: string,
    subDomain: string,
    catalogId?: string,
    localId?: string
  ): Promise<SyncResult> {
    try {
      // Get catalog ID if not provided
      const targetCatalogId = catalogId || await this.getPrimaryCatalogId(subDomain, localId);

      if (!targetCatalogId) {
        return {
          success: false,
          productId: productRId,
          action: 'skip',
          error: 'No catalog configured or sync disabled'
        };
      }

      await MetaCatalogService.deleteProduct(
        targetCatalogId,
        productRId,
        subDomain,
        localId
      );

      logger.info('Product removed from catalog', {
        productId: productRId,
        catalogId: targetCatalogId,
        subDomain
      });

      return {
        success: true,
        productId: productRId,
        catalogId: targetCatalogId,
        action: 'delete'
      };
    } catch (error: any) {
      logger.error('Error removing product from catalog:', {
        productId: productRId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        productId: productRId,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Sync product availability update (stock changes)
   * Optimized for frequent stock updates
   */
  static async syncProductAvailability(
    product: IProduct,
    catalogId?: string
  ): Promise<SyncResult> {
    try {
      // Get catalog ID if not provided
      const targetCatalogId = catalogId || await this.getPrimaryCatalogId(product.subDomain, product.localId);

      if (!targetCatalogId) {
        return {
          success: false,
          productId: product.rId,
          action: 'skip',
          error: 'No catalog configured or sync disabled'
        };
      }

      // Only update availability
      const availability = product.isOutOfStock
        ? 'out of stock' as const
        : product.isAvailable
          ? 'in stock' as const
          : 'available for order' as const;

      await MetaCatalogService.updateProduct(
        targetCatalogId,
        product.rId,
        { availability },
        product.subDomain,
        product.localId
      );

      logger.info('Product availability updated in catalog', {
        productId: product.rId,
        catalogId: targetCatalogId,
        availability
      });

      return {
        success: true,
        productId: product.rId,
        catalogId: targetCatalogId,
        action: 'update'
      };
    } catch (error: any) {
      logger.error('Error syncing product availability:', {
        productId: product.rId,
        error: error.message
      });

      return {
        success: false,
        productId: product.rId,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Get sync status for a business
   */
  static async getSyncStatus(
    subDomain: string,
    localId?: string
  ): Promise<{
    catalogId: string | null;
    syncEnabled: boolean;
    lastSyncAt?: Date;
    totalProducts: number;
    syncedProducts: number;
  }> {
    try {
      const { Product } = await import('../../models/Product');

      const catalogId = await this.getPrimaryCatalogId(subDomain, localId);
      const business = await Business.findOne({ subDomain });

      const query: any = { subDomain, isActive: true };
      if (localId) {
        query.localId = localId;
      }

      const totalProducts = await Product.countDocuments(query);

      return {
        catalogId,
        syncEnabled: business?.catalogSyncEnabled !== false,
        lastSyncAt: business?.lastCatalogSyncAt,
        totalProducts,
        syncedProducts: 0 // Can be enhanced to track actual synced count
      };
    } catch (error: any) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  }
}
