/**
 * Meta Product Catalog Types
 *
 * These types represent the Meta/Facebook Business Manager Product Catalog structure
 * Used for WhatsApp Business API catalog integration
 */

/**
 * Catalog vertical types (industry)
 */
export type CatalogVertical =
  | 'adoptable_pets'
  | 'commerce'
  | 'destinations'
  | 'flights'
  | 'generic'
  | 'home_listings'
  | 'hotels'
  | 'local_service_businesses'
  | 'offer_items'
  | 'offline_commerce'
  | 'transactable_items'
  | 'vehicles';

/**
 * Catalog permission tasks
 */
export type CatalogTask = 'MANAGE' | 'ADVERTISE' | 'MANAGE_AR' | 'AA_ANALYZE';

/**
 * Product availability status
 */
export type ProductAvailability =
  | 'in stock'
  | 'out of stock'
  | 'preorder'
  | 'available for order'
  | 'discontinued';

/**
 * Product condition
 */
export type ProductCondition = 'new' | 'refurbished' | 'used';

/**
 * Catalog information from Meta API
 */
export interface CatalogInfo {
  id: string;
  name: string;
  business?: {
    id: string;
    name: string;
  };
  vertical?: CatalogVertical;
  product_count?: number;
  feed_count?: number;
  default_image_url?: string;
  fallback_image_url?: string[];
  is_catalog_segment?: boolean;
  is_local_catalog?: boolean;
}

/**
 * Product item from Meta API
 */
export interface ProductItem {
  id: string;
  retailer_id: string;
  name?: string;
  description?: string;
  price?: string;
  currency?: string;
  availability?: ProductAvailability;
  condition?: ProductCondition;
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
  visibility?: 'staging' | 'published';
  sale_price?: string;
  sale_price_effective_date?: string;
}

/**
 * Parameters for creating a new catalog
 */
export interface CreateCatalogRequest {
  name: string;
  vertical?: CatalogVertical;
  defaultImageUrl?: string;
  fallbackImageUrl?: string;
  subDomain: string;
  localId?: string;
}

/**
 * Parameters for updating a catalog
 */
export interface UpdateCatalogRequest {
  name?: string;
  defaultImageUrl?: string;
  fallbackImageUrl?: string;
  subDomain: string;
  localId?: string;
}

/**
 * Parameters for creating a product
 */
export interface CreateProductRequest {
  retailer_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  availability?: ProductAvailability;
  condition?: ProductCondition;
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
}

/**
 * Parameters for updating a product
 */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  availability?: ProductAvailability;
  condition?: ProductCondition;
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
}

/**
 * Batch operation for products
 */
export interface BatchProductOperation {
  method: 'CREATE' | 'UPDATE' | 'DELETE';
  retailer_id: string;
  data?: CreateProductRequest | UpdateProductRequest;
}

/**
 * Assign user to catalog request
 */
export interface AssignUserToCatalogRequest {
  userId: string;
  tasks: CatalogTask[];
}

/**
 * Catalog user with permissions
 */
export interface CatalogUser {
  id: string;
  name?: string;
  email?: string;
  tasks: CatalogTask[];
  business?: {
    id: string;
    name: string;
  };
}

/**
 * API Response wrapper
 */
export interface CatalogApiResponse<T> {
  type: '1' | '2' | '3'; // 1 = success, 2 = warning, 3 = error
  message: string;
  data: T | null;
  timestamp?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

/**
 * Product feed information
 */
export interface ProductFeed {
  id: string;
  name: string;
  schedule?: {
    interval: 'DAILY' | 'HOURLY' | 'WEEKLY';
    url: string;
  };
  file_name?: string;
  latest_upload?: {
    id: string;
    start_time: string;
    end_time?: string;
    num_items_processed?: number;
    num_items_accepted?: number;
    num_errors?: number;
  };
}

/**
 * Product set (collection of products)
 */
export interface ProductSet {
  id: string;
  name: string;
  filter?: Record<string, any>;
  product_count?: number;
  auto_creation_url?: string;
}

/**
 * Catalog sync status
 */
export interface CatalogSyncStatus {
  catalogId: string;
  lastSyncAt?: Date;
  syncStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  errors?: Array<{
    retailerId: string;
    error: string;
  }>;
}

/**
 * Menu item to catalog product mapping
 */
export interface MenuItemToProduct {
  menuItemId: string;
  productRetailerId: string;
  catalogId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  syncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  error?: string;
}
