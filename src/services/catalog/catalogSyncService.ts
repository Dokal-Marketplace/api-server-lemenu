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
   * Get catalog ID for a specific category
   * Falls back to primary catalog if category mapping doesn't exist
   */
  private static async getCatalogIdForCategory(
    categoryId: string,
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

      // Try to get category-specific catalog ID first
      if (business.fbCatalogMapping) {
        const catalogMapping = business.fbCatalogMapping as any;
        const categoryCatalogId = catalogMapping[categoryId];

        if (categoryCatalogId) {
          logger.debug('Found category-specific catalog', {
            categoryId,
            catalogId: categoryCatalogId,
            subDomain
          });
          return categoryCatalogId;
        }
      }

      // Fall back to primary catalog ID
      const catalogId = business.fbCatalogIds?.[0];

      if (!catalogId) {
        logger.warn('No catalog ID configured for business', { subDomain, categoryId });
        return null;
      }

      logger.debug('Using primary catalog ID for category', {
        categoryId,
        catalogId,
        subDomain
      });

      return catalogId;
    } catch (error: any) {
      logger.error('Error getting catalog ID for category:', error);
      return null;
    }
  }

  /**
   * Get primary catalog ID for a business (legacy method)
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
   * Convert price to cents (integer) as required by Facebook Catalog API
   */
  private static convertPriceToCents(price: number): number {
    if (typeof price !== 'number' || isNaN(price)) {
      throw new Error('Invalid price: must be a valid number');
    }
    if (price < 0) {
      throw new Error('Invalid price: must be non-negative');
    }
    // Convert to cents and round to avoid floating point issues
    return Math.round(price * 100);
  }

  /**
   * Get price range from product presentations
   * Returns { min, max, hasRange } where hasRange indicates multiple price points
   */
  private static async getPriceRangeFromPresentations(
    productId: string
  ): Promise<{ minPrice: number; maxPrice: number; hasRange: boolean }> {
    try {
      const { Presentation } = await import('../../models/Presentation');

      const presentations = await Presentation.find({
        productId: productId,
        isActive: true
      });

      if (presentations.length === 0) {
        return { minPrice: 0, maxPrice: 0, hasRange: false };
      }

      // Get all presentation prices (use amountWithDiscount if available, else price)
      const prices = presentations.map(p => p.amountWithDiscount || p.price);

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const hasRange = minPrice !== maxPrice;

      return { minPrice, maxPrice, hasRange };
    } catch (error: any) {
      logger.error('Error getting price range from presentations:', {
        productId,
        error: error.message
      });
      return { minPrice: 0, maxPrice: 0, hasRange: false };
    }
  }

  /**
   * Map internal product to Facebook Catalog format
   * Supports category-based catalog strategy with price ranges
   */
  private static async mapProductToCatalogFormat(
    product: IProduct,
    options?: {
      includePriceRange?: boolean;
    }
  ): Promise<CreateProductParams> {
    const { includePriceRange = false } = options || {};

    let displayPrice = product.basePrice;
    let productName = product.name;
    let productDescription = product.description || '';

    // Get price range from presentations if enabled
    if (includePriceRange) {
      const { minPrice, maxPrice, hasRange } = await this.getPriceRangeFromPresentations(
        String(product._id)
      );

      if (hasRange && minPrice > 0) {
        displayPrice = minPrice; // Show lowest price in catalog
        productName = `${product.name} ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
        productDescription = `${productDescription}\n\n📏 Available in multiple sizes\n🎨 Customization available`.trim();
      }
    }

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

    // Convert price to cents (Facebook requires integer in cents)
    const priceInCents = this.convertPriceToCents(displayPrice);

    // Build catalog product
    const catalogProduct: CreateProductParams = {
      retailer_id: product.rId,
      name: productName,
      price: priceInCents,
      currency: 'PEN', // Default currency - can be made configurable
      availability,
      condition: 'new',
    };

    // Add optional fields if available
    if (productDescription) {
      catalogProduct.description = productDescription;
    }

    // Facebook requires image_url - use product image or placeholder
    catalogProduct.image_url = product.imageUrl || 'https://via.placeholder.com/800x600.png?text=No+Image';

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
      const catalogProduct = await this.mapProductToCatalogFormat(product);

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
      const operations: BatchProductOperation[] = await Promise.all(
        products.map(async (product) => {
          const catalogProduct = await this.mapProductToCatalogFormat(product);

          return {
            method: 'CREATE',
            retailer_id: product.rId,
            data: catalogProduct
          };
        })
      );

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

  /**
   * Create category-based catalogs for a business
   * This method creates separate catalogs for each active category
   */
  static async createCategoryBasedCatalogs(
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    catalogsCreated: number;
    catalogMapping: Record<string, string>;
    errors: Array<{ categoryId: string; error: string }>;
  }> {
    try {
      const { Category } = await import('../../models/Category');

      // Get business
      const business = await Business.findOne({ subDomain });

      if (!business) {
        return {
          success: false,
          catalogsCreated: 0,
          catalogMapping: {},
          errors: [{ categoryId: 'business', error: 'Business not found' }]
        };
      }

      // Get all active categories
      const query: any = {
        subDomain,
        isActive: true
      };

      if (localId) {
        query.localsId = localId;
      }

      const categories = await Category.find(query);

      if (categories.length === 0) {
        logger.info('No active categories found', { subDomain, localId });
        return {
          success: true,
          catalogsCreated: 0,
          catalogMapping: {},
          errors: []
        };
      }

      logger.info('Creating category-based catalogs', {
        subDomain,
        categoryCount: categories.length
      });

      const catalogMapping: Record<string, string> = {};
      const errors: Array<{ categoryId: string; error: string }> = [];
      let catalogsCreated = 0;

      // Create a catalog for each category
      for (const category of categories) {
        try {
          const catalogName = `${business.name} - ${category.name}`;

          logger.info('Creating catalog for category', {
            categoryId: category.rId,
            categoryName: category.name,
            catalogName
          });

          // Create catalog via Meta API
          const catalog = await MetaCatalogService.createCatalog(
            {
              name: catalogName,
              vertical: 'commerce'
            },
            subDomain,
            localId
          );

          catalogMapping[category.rId] = catalog.id;
          catalogsCreated++;

          logger.info('Catalog created for category', {
            categoryId: category.rId,
            catalogId: catalog.id
          });
        } catch (error: any) {
          logger.error('Error creating catalog for category', {
            categoryId: category.rId,
            error: error.message
          });
          errors.push({
            categoryId: category.rId,
            error: error.message || 'Unknown error'
          });
        }
      }

      // Update business with catalog mapping
      if (Object.keys(catalogMapping).length > 0) {
        business.fbCatalogMapping = catalogMapping as any;
        await business.save();

        logger.info('Business catalog mapping updated', {
          subDomain,
          catalogMapping
        });
      }

      return {
        success: errors.length === 0,
        catalogsCreated,
        catalogMapping,
        errors
      };
    } catch (error: any) {
      logger.error('Error creating category-based catalogs:', error);
      throw error;
    }
  }

  /**
   * Sync all products in a specific category to its catalog
   */
  static async syncCategoryToCatalog(
    categoryId: string,
    subDomain: string,
    localId?: string
  ): Promise<BatchSyncResult> {
    try {
      const { Product } = await import('../../models/Product');

      // Get category-specific catalog ID
      const catalogId = await this.getCatalogIdForCategory(categoryId, subDomain, localId);

      if (!catalogId) {
        return {
          success: false,
          synced: 0,
          failed: 0,
          skipped: 0,
          errors: [{
            productId: 'category',
            error: 'No catalog configured for this category'
          }]
        };
      }

      // Get all products in this category
      const query: any = {
        categoryId: categoryId,
        subDomain: subDomain,
        isActive: true
      };

      if (localId) {
        query.localId = localId;
      }

      const products = await Product.find(query);

      if (products.length === 0) {
        logger.info('No products found for category', { categoryId, subDomain, localId });
        return {
          success: true,
          synced: 0,
          failed: 0,
          skipped: 0,
          errors: []
        };
      }

      logger.info('Starting category product sync', {
        categoryId,
        subDomain,
        catalogId,
        productCount: products.length
      });

      // Prepare batch operations with price ranges
      const operations: BatchProductOperation[] = await Promise.all(
        products.map(async (product) => {
          const catalogProduct = await this.mapProductToCatalogFormat(product, {
            includePriceRange: true // Enable price range for category-based catalogs
          });

          return {
            method: 'CREATE',
            retailer_id: product.rId,
            data: catalogProduct
          };
        })
      );

      // Execute batch sync
      const result = await MetaCatalogService.batchProductOperations(
        catalogId,
        operations,
        subDomain,
        localId
      );

      logger.info('Category sync completed', {
        categoryId,
        subDomain,
        catalogId,
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
      logger.error('Error syncing category to catalog:', {
        categoryId,
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
          productId: 'category',
          error: error.message || 'Unknown error'
        }]
      };
    }
  }
}
