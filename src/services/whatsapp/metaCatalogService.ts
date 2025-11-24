import { Business, IBusiness } from '../../models/Business';
import logger from '../../utils/logger';

const META_API_VERSION = 'v24.0';
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Types and Interfaces
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

export type CatalogTask = 'MANAGE' | 'ADVERTISE' | 'MANAGE_AR' | 'AA_ANALYZE';

export interface CreateCatalogParams {
  name: string;
  vertical?: CatalogVertical;
  defaultImageUrl?: string;
  fallbackImageUrl?: string;
}

export interface UpdateCatalogParams {
  name?: string;
  defaultImageUrl?: string;
  fallbackImageUrl?: string;
}

export interface CatalogInfo {
  id: string;
  name: string;
  business?: {
    id: string;
    name: string;
  };
  vertical?: string;
  product_count?: number;
  feed_count?: number;
  default_image_url?: string;
  fallback_image_url?: string[];
  is_catalog_segment?: boolean;
}

export interface ProductItem {
  id: string;
  retailer_id: string;
  name?: string;
  description?: string;
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued';
  condition?: 'new' | 'refurbished' | 'used';
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
}

export interface CreateProductParams {
  retailer_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  availability?: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued';
  condition?: 'new' | 'refurbished' | 'used';
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
}

export interface UpdateProductParams {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued';
  condition?: 'new' | 'refurbished' | 'used';
  image_url?: string;
  url?: string;
  brand?: string;
  category?: string;
  additional_image_urls?: string[];
}

export interface BatchProductOperation {
  method: 'CREATE' | 'UPDATE' | 'DELETE';
  retailer_id: string;
  data?: CreateProductParams | UpdateProductParams;
}

export interface AssignUserToCatalogParams {
  userId: string;
  tasks: CatalogTask[];
}

/**
 * Meta Catalog Service
 * Handles all catalog management operations for Meta Business Manager
 */
export class MetaCatalogService {
  /**
   * Get business by subDomain and optional localId
   */
  private static async getBusinessBySubDomain(
    subDomain: string,
    localId?: string
  ): Promise<IBusiness | null> {
    try {
      let business: IBusiness | null;
      if (localId) {
        const { BusinessLocation } = await import('../../models/BusinessLocation');
        const businessLocation = await BusinessLocation.findOne({
          subDomain,
          localId
        });
        if (!businessLocation) {
          logger.error(`BusinessLocation not found for subDomain ${subDomain}, localId ${localId}`);
          return null;
        }
        business = await Business.findOne({ businessId: businessLocation.businessId });
      } else {
        business = await Business.findOne({ subDomain });
      }

      return business;
    } catch (error) {
      logger.error(`Error getting business for ${subDomain}: ${error}`);
      return null;
    }
  }

  /**
   * Make API request to Meta Graph API
   */
  private static async makeApiRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    accessToken: string,
    data?: any
  ): Promise<any> {
    const url = `${META_API_BASE_URL}${endpoint}`;

    // Log the request
    logger.info('Meta API Request', {
      method,
      url,
      endpoint,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    });

    try {
      let fetchOptions: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      };

      if (method === 'POST' && data) {
        // Use FormData for POST requests
        const formData = new URLSearchParams();
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        fetchOptions.body = formData;
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      }

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();

      if (!response.ok) {
        logger.error('Meta API request failed', {
          method,
          url,
          status: response.status,
          endpoint,
          error: responseData,
        });
        throw new Error(responseData.error?.message || 'Meta API request failed');
      }

      // Log successful response
      logger.info('Meta API Response', {
        method,
        url,
        status: response.status,
        hasData: !!responseData.data,
        dataLength: responseData.data ? responseData.data.length : undefined,
      });

      return responseData;
    } catch (error: any) {
      logger.error(`Meta API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get decrypted access token for a business
   */
  private static getDecryptedAccessToken(business: IBusiness): string {
    if (!business.whatsappAccessToken) {
      throw new Error(`WhatsApp access token not configured for ${business.subDomain}`);
    }

    // Get decrypted access token using Business model method
    const decryptedToken = (business as any).getDecryptedWhatsAppAccessToken();
    if (!decryptedToken) {
      logger.error(`Failed to decrypt WhatsApp token for business ${business.subDomain}`);
      throw new Error(`Failed to decrypt WhatsApp access token for ${business.subDomain}`);
    }

    return decryptedToken;
  }

  /**
   * Ensure business has Business Manager ID, fetching it from Meta if needed
   */
  private static async ensureBusinessManagerId(business: IBusiness): Promise<string> {
    if (business.businessManagerId) {
      return business.businessManagerId;
    }

    if (!business.wabaId) {
      throw new Error(`WABA ID not configured for ${business.subDomain}`);
    }

    try {
      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${business.wabaId}?fields=business`;
      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      const managerId = response?.business?.id;

      if (!managerId) {
        logger.error('Meta response missing business id when fetching Business Manager ID', {
          subDomain: business.subDomain,
          wabaId: business.wabaId,
        });
        throw new Error('Unable to retrieve Business Manager ID from Meta');
      }

      business.businessManagerId = managerId;
      await business.save();

      logger.info('Business Manager ID fetched from Meta and cached', {
        subDomain: business.subDomain,
        businessManagerId: managerId,
      });

      return managerId;
    } catch (error) {
      logger.error(`Failed to auto-fetch Business Manager ID for ${business.subDomain}:`, error);
      throw new Error(`Unable to determine Business Manager ID for ${business.subDomain}`);
    }
  }

  /**
   * Get all catalogs owned by a business
   */
  static async getCatalogs(
    subDomain: string,
    localId?: string
  ): Promise<{ catalogs: CatalogInfo[] }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);
      const businessManagerId = await this.ensureBusinessManagerId(business);
      const endpoint = `/${businessManagerId}/owned_product_catalogs`;
      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      return {
        catalogs: response.data || [],
      };
    } catch (error: any) {
      logger.error('Error getting catalogs:', error);
      throw error;
    }
  }

  /**
   * Get a specific catalog by ID
   */
  static async getCatalog(
    catalogId: string,
    subDomain: string,
    localId?: string
  ): Promise<CatalogInfo> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${catalogId}`;
      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      return response;
    } catch (error: any) {
      logger.error(`Error getting catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new product catalog
   */
  static async createCatalog(
    params: CreateCatalogParams,
    subDomain: string,
    localId?: string
  ): Promise<{ id: string; success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);
      const businessManagerId = await this.ensureBusinessManagerId(business);
      const endpoint = `/${businessManagerId}/owned_product_catalogs`;
      const data: {
        name: string;
        vertical: CatalogVertical;
        default_image_url?: string;
        fallback_image_url?: string;
      } = {
        name: params.name,
        vertical: params.vertical || 'commerce',
      };

      if (params.defaultImageUrl) {
        data.default_image_url = params.defaultImageUrl;
      }

      if (params.fallbackImageUrl) {
        data.fallback_image_url = params.fallbackImageUrl;
      }

      const response = await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        data
      );

      logger.info(`Catalog created successfully: ${response.id}`, {
        subDomain,
        catalogId: response.id,
      });

      return {
        id: response.id,
        success: true,
      };
    } catch (error: any) {
      logger.error('Error creating catalog:', error);
      throw error;
    }
  }

  /**
   * Update an existing catalog
   */
  static async updateCatalog(
    catalogId: string,
    params: UpdateCatalogParams,
    subDomain: string,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${catalogId}`;
      const response = await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        params
      );

      logger.info(`Catalog updated successfully: ${catalogId}`, {
        subDomain,
      });

      return {
        success: response.success || true,
      };
    } catch (error: any) {
      logger.error(`Error updating catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a catalog
   */
  static async deleteCatalog(
    catalogId: string,
    subDomain: string,
    allowDeleteWithLiveProductSet?: boolean,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${catalogId}${allowDeleteWithLiveProductSet ? '?allow_delete_catalog_with_live_product_set=true' : ''}`;
      const response = await this.makeApiRequest(
        'DELETE',
        endpoint,
        decryptedToken
      );

      logger.info(`Catalog deleted successfully: ${catalogId}`, {
        subDomain,
      });

      return {
        success: response.success || true,
      };
    } catch (error: any) {
      logger.error(`Error deleting catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Get all products in a catalog
   */
  static async getProducts(
    catalogId: string,
    subDomain: string,
    limit: number = 100,
    after?: string,
    localId?: string
  ): Promise<{ products: ProductItem[]; paging?: any }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      let endpoint = `/${catalogId}/products?limit=${limit}`;
      if (after) {
        endpoint += `&after=${after}`;
      }

      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      return {
        products: response.data || [],
        paging: response.paging,
      };
    } catch (error: any) {
      logger.error(`Error getting products for catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific product by retailer_id
   */
  static async getProduct(
    catalogId: string,
    retailerId: string,
    subDomain: string,
    localId?: string
  ): Promise<ProductItem> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${catalogId}/products?filter={"retailer_id":{"eq":"${retailerId}"}}`;
      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      if (!response.data || response.data.length === 0) {
        throw new Error(`Product with retailer_id ${retailerId} not found`);
      }

      return response.data[0];
    } catch (error: any) {
      logger.error(`Error getting product ${retailerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a single product in a catalog
   */
  static async createProduct(
    catalogId: string,
    params: CreateProductParams,
    subDomain: string,
    localId?: string
  ): Promise<{ id: string; success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const endpoint = `/${catalogId}/products`;
      const response = await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        params
      );

      logger.info(`Product created successfully in catalog ${catalogId}`, {
        subDomain,
        retailerId: params.retailer_id,
      });

      return {
        id: response.id,
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error creating product in catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Update a product in a catalog (using batch API)
   */
  static async updateProduct(
    catalogId: string,
    retailerId: string,
    params: UpdateProductParams,
    subDomain: string,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      // Use batch API for update
      const batchRequest = {
        item_type: 'PRODUCT_ITEM',  // Required by Meta API
        requests: JSON.stringify([
          {
            method: 'UPDATE',
            data: {
              id: retailerId,  // id is required to identify the product
              ...params  // spread the update params
            }
          },
        ]),
      };

      const endpoint = `/${catalogId}/items_batch`;
      await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        batchRequest
      );

      logger.info(`Product updated successfully in catalog ${catalogId}`, {
        subDomain,
        retailerId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error updating product ${retailerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product from a catalog (using batch API)
   */
  static async deleteProduct(
    catalogId: string,
    retailerId: string,
    subDomain: string,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      // Use batch API for delete
      const batchRequest = {
        item_type: 'PRODUCT_ITEM',  // Required by Meta API
        requests: JSON.stringify([
          {
            method: 'DELETE',
            data: {
              id: retailerId  // For DELETE, use 'id' field in data object
            }
          },
        ]),
      };

      const endpoint = `/${catalogId}/items_batch`;
      await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        batchRequest
      );

      logger.info(`Product deleted successfully from catalog ${catalogId}`, {
        subDomain,
        retailerId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error deleting product ${retailerId}:`, error);
      throw error;
    }
  }

  /**
   * Batch operations on products (CREATE, UPDATE, DELETE)
   */
  static async batchProductOperations(
    catalogId: string,
    operations: BatchProductOperation[],
    subDomain: string,
    localId?: string
  ): Promise<{ handle: string; success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);

      const requests = operations.map(op => {
        const request: any = {
          method: op.method,
        };

        if (op.method === 'DELETE') {
          // For DELETE, only pass the id field in data
          request.data = {
            id: op.retailer_id
          };
        } else if (op.data) {
          // For CREATE/UPDATE, transform retailer_id to id
          const dataWithId = { ...op.data };

          // The batch API uses 'id' field instead of 'retailer_id'
          if (dataWithId.retailer_id) {
            dataWithId.id = dataWithId.retailer_id;
            delete dataWithId.retailer_id;
          } else if (op.retailer_id) {
            dataWithId.id = op.retailer_id;
          }

          request.data = dataWithId;
        }

        return request;
      });

      const batchRequest = {
        item_type: 'PRODUCT_ITEM',  // Required by Meta API - must be PRODUCT_ITEM for products
        requests: JSON.stringify(requests),
      };

      const endpoint = `/${catalogId}/items_batch`;
      const response = await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        batchRequest
      );

      logger.info(`Batch operations completed for catalog ${catalogId}`, {
        subDomain,
        operationCount: operations.length,
      });

      return {
        handle: response.handle || response.handles?.[0],
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error performing batch operations on catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Assign user to catalog with specific permissions
   */
  static async assignUserToCatalog(
    catalogId: string,
    params: AssignUserToCatalogParams,
    subDomain: string,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);
      const businessManagerId = await this.ensureBusinessManagerId(business);
      const endpoint = `/${catalogId}/assigned_users`;
      const data = {
        user: params.userId,
        business: businessManagerId,
        tasks: JSON.stringify(params.tasks),
      };

      const response = await this.makeApiRequest(
        'POST',
        endpoint,
        decryptedToken,
        data
      );

      logger.info(`User assigned to catalog ${catalogId}`, {
        subDomain,
        userId: params.userId,
        tasks: params.tasks,
      });

      return {
        success: response.success || true,
      };
    } catch (error: any) {
      logger.error(`Error assigning user to catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Remove user from catalog
   */
  static async removeUserFromCatalog(
    catalogId: string,
    userId: string,
    subDomain: string,
    localId?: string
  ): Promise<{ success: boolean }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);
      const businessManagerId = await this.ensureBusinessManagerId(business);
      const endpoint = `/${catalogId}/assigned_users?user=${userId}&business=${businessManagerId}`;
      const response = await this.makeApiRequest(
        'DELETE',
        endpoint,
        decryptedToken
      );

      logger.info(`User removed from catalog ${catalogId}`, {
        subDomain,
        userId,
      });

      return {
        success: response.success || true,
      };
    } catch (error: any) {
      logger.error(`Error removing user from catalog ${catalogId}:`, error);
      throw error;
    }
  }

  /**
   * Get all users assigned to a catalog
   */
  static async getCatalogUsers(
    catalogId: string,
    subDomain: string,
    localId?: string
  ): Promise<{ users: any[] }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        throw new Error(`Business not found for ${subDomain}`);
      }

      const decryptedToken = this.getDecryptedAccessToken(business);
      const businessManagerId = await this.ensureBusinessManagerId(business);
      const endpoint = `/${catalogId}/assigned_users?business=${businessManagerId}`;
      const response = await this.makeApiRequest(
        'GET',
        endpoint,
        decryptedToken
      );

      return {
        users: response.data || [],
      };
    } catch (error: any) {
      logger.error(`Error getting users for catalog ${catalogId}:`, error);
      throw error;
    }
  }
}
