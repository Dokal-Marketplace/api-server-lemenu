// services/businessService.ts
import { Business, IBusiness } from '../../models/Business';
import { BusinessLocation } from '../../models/BusinessLocation';

export interface CreateBusinessInput {
  // Core business fields
  name: string;
  description?: string;
  subDomain: string;
  domainLink: string;
  logo?: string;
  coverImage?: string;
  
  // Contact information
  phone: string;
  whatsapp: string;
  phoneCountryCode?: string;
  whatsappCountryCode?: string;
  
  // Business settings
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  acceptsOnlinePayment?: boolean;
  onlinePaymentOnly?: boolean;
  taxPercentage?: number;
  
  // Address information
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Owner information
  owner: {
    userId: string;
    name: string;
    email: string;
  };
  
  // Additional settings
  settings?: Partial<IBusiness['settings']>;
}

export interface UpdateBusinessInput {
  // Core business fields
  name?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  
  // Contact information
  phone?: string;
  whatsapp?: string;
  phoneCountryCode?: string;
  whatsappCountryCode?: string;
  
  // Business settings
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  acceptsOnlinePayment?: boolean;
  onlinePaymentOnly?: boolean;
  taxPercentage?: number;
  isOpenForDelivery?: boolean;
  isOpenForPickup?: boolean;
  isActive?: boolean;
  
  // Address information
  address?: Partial<IBusiness['address']>;
  
  // Status and settings
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<IBusiness['settings']>;
}

export interface BusinessQueryFilters {
  // Core identifiers
  userId?: string;
  subDomain?: string;
  businessId?: string;
  localId?: string;
  
  // Status filters
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  
  // Location filters
  city?: string;
  state?: string;
  country?: string;
  
  // Service filters
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  
  // Search and pagination
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class BusinessService {
  /**
   * Create a new business
   */
  static async createBusiness(data: CreateBusinessInput): Promise<IBusiness> {
    try {
      // Check if subdomain already exists
      const existingBusiness = await Business.findOne({
        subDomain: data.subDomain
      });

      if (existingBusiness) {
        throw new Error('Subdomain already exists');
      }

      // Set default settings if not provided
      const defaultSettings = {
        currency: 'PEN' as const,
        timezone: 'America/Lima',
        taxRate: data.taxPercentage || 18,
        serviceCharge: 0,
        deliveryFee: 0,
        minOrderValue: 0,
        maxDeliveryDistance: 10,
        autoAcceptOrders: false,
        orderNotifications: true,
        paymentMethods: [
          {
            type: 'cash' as const,
            name: 'Cash',
            isActive: true
          }
        ],
        features: {
          delivery: data.acceptsDelivery ?? true,
          pickup: data.acceptsPickup ?? true,
          onSite: false,
          scheduling: false,
          coupons: false
        }
      };

      const businessData = {
        ...data,
        phoneCountryCode: data.phoneCountryCode || '+51',
        whatsappCountryCode: data.whatsappCountryCode || '+51',
        acceptsDelivery: data.acceptsDelivery ?? true,
        acceptsPickup: data.acceptsPickup ?? true,
        acceptsOnlinePayment: data.acceptsOnlinePayment ?? true,
        onlinePaymentOnly: data.onlinePaymentOnly ?? false,
        taxPercentage: data.taxPercentage ?? 18,
        isOpenForDelivery: true,
        isOpenForPickup: true,
        isActive: true,
        status: 'active' as const,
        settings: { ...defaultSettings, ...data.settings },
        locations: []
      };

      const business = new Business(businessData);
      await business.save();

      return business;
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get a single business by various filters
   */
  static async getBusiness(filters: BusinessQueryFilters): Promise<IBusiness | null> {
    try {
      // If localId is provided, find the BusinessLocation first, then get the parent Business
      if (filters.localId) {
        const businessLocation = await BusinessLocation.findOne({ localId: filters.localId });
        if (!businessLocation) {
          return null;
        }
        
        // Get the parent business using the businessId from the location
        const business = await Business.findOne({ businessId: businessLocation.businessId });
        return business;
      }

      // For other queries, search Business model directly
      const query: any = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.subDomain) query.subDomain = filters.subDomain;
      if (filters.businessId) query.businessId = filters.businessId;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.status) query.status = filters.status;

      const business = await Business.findOne(query);
      return business;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get multiple businesses with pagination and filters
   */
  static async getBusinesses(filters: BusinessQueryFilters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        ...queryFilters
      } = filters;

      const query: any = {};

      // Apply filters
      Object.keys(queryFilters).forEach(key => {
        if (queryFilters[key as keyof typeof queryFilters] !== undefined) {
          query[key] = queryFilters[key as keyof typeof queryFilters];
        }
      });

      // Add text search if provided
      if (search) {
        query.$text = { $search: search };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      // Build base query
      let findQuery = Business.find(query);

      // If doing text search and sorting by score, include text score meta
      if (search && sortBy === 'score') {
        findQuery = findQuery.select({ score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } });
      } else {
        findQuery = findQuery.sort(sortObj);
      }

      // Apply pagination
      findQuery = findQuery.skip(skip).limit(limit);

      const [businesses, total] = await Promise.all([
        findQuery.exec(),
        Business.countDocuments(query)
      ]);

      return {
        businesses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get businesses by owner/user
   */
  static async getBusinessesByOwner(userId: string, options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      return await this.getBusinesses({
        userId,
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get business locals (legacy method name)
   */
  static async getBusinessLocal(filters: BusinessQueryFilters): Promise<IBusiness[]> {
    try {
      const query: any = {};

      // Use new address structure for location filtering
      if (filters.city) query['address.city'] = filters.city;
      if (filters.state) query['address.state'] = filters.state;
      if (filters.country) query['address.country'] = filters.country;
      
      if (filters.acceptsDelivery !== undefined) query.acceptsDelivery = filters.acceptsDelivery;
      if (filters.acceptsPickup !== undefined) query.acceptsPickup = filters.acceptsPickup;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;

      const businesses = await Business.find(query).lean();
      return businesses as IBusiness[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update business
   */
  static async updateBusiness(
    identifier: string,
    updates: UpdateBusinessInput,
    identifierType: 'id' | 'subDomain' | 'businessId' | 'localId' = 'id'
  ): Promise<IBusiness | null> {
    try {
      let query: any = {};
      
      // If localId is provided, find the BusinessLocation first to get the parent businessId
      if (identifierType === 'localId') {
        const businessLocation = await BusinessLocation.findOne({ localId: identifier });
        if (!businessLocation) {
          return null;
        }
        query.businessId = businessLocation.businessId;
      } else {
        // For other identifier types, build query normally
        switch (identifierType) {
          case 'subDomain':
            query.subDomain = identifier;
            break;
          case 'businessId':
            query.businessId = identifier;
            break;
          default:
            query._id = identifier;
        }
      }

      // Handle nested updates for address and settings
      const updateData: any = { ...updates };
      
      if (updates.address) {
        Object.keys(updates.address).forEach(key => {
          updateData[`address.${key}`] = updates.address![key as keyof typeof updates.address];
        });
        delete updateData.address;
      }

      if (updates.settings) {
        Object.keys(updates.settings).forEach(key => {
          updateData[`settings.${key}`] = updates.settings![key as keyof typeof updates.settings];
        });
        delete updateData.settings;
      }

      const business = await Business.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return business;
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  /**
   * Create a new local (legacy method name - same as createBusiness)
   */
  static async createLocal(data: CreateBusinessInput): Promise<IBusiness> {
    return await this.createBusiness(data);
  }

  /**
   * Delete business (soft delete by setting isActive to false)
   */
  static async deleteBusiness(
    identifier: string,
    identifierType: 'id' | 'subDomain' | 'businessId' | 'localId' = 'id'
  ): Promise<IBusiness | null> {
    try {
      return await this.updateBusiness(identifier, { isActive: false, status: 'inactive' }, identifierType);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle business status (open/closed for delivery/pickup)
   */
  static async toggleBusinessStatus(
    identifier: string,
    status: {
      isActive?: boolean;
    },
    identifierType: 'id' | 'subDomain' | 'businessId' | 'localId' = 'id'
  ): Promise<IBusiness | null> {
    try {
      return await this.updateBusiness(identifier, status, identifierType);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search businesses by text
   */
  static async searchBusinesses(searchTerm: string, options: { page?: number; limit?: number } = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      return await this.getBusinesses({
        search: searchTerm,
        page,
        limit,
        sortBy: 'score',
        sortOrder: 'desc'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get businesses by location
   */
  static async getBusinessesByLocation(
    city?: string,
    state?: string,
    country?: string,
    options: { page?: number; limit?: number } = {}
  ) {
    try {
      const filters: BusinessQueryFilters = {
        isActive: true,
        status: 'active',
        ...options
      };

      if (city) filters.city = city;
      if (state) filters.state = state;
      if (country) filters.country = country;

      return await this.getBusinesses(filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate business data
   */
  static validateBusinessData(data: Partial<CreateBusinessInput>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!data.name) errors.push('name is required');
    if (!data.subDomain) errors.push('subDomain is required');
    if (!data.domainLink) errors.push('domainLink is required');
    if (!data.phone) errors.push('phone is required');
    if (!data.whatsapp) errors.push('whatsapp is required');
    if (!data.owner) errors.push('owner is required');
    if (!data.owner?.userId) errors.push('owner.userId is required');
    if (!data.owner?.name) errors.push('owner.name is required');
    if (!data.owner?.email) errors.push('owner.email is required');
    if (!data.address) errors.push('address is required');
    if (!data.address?.street) errors.push('address.street is required');
    if (!data.address?.city) errors.push('address.city is required');
    if (!data.address?.state) errors.push('address.state is required');
    if (!data.address?.country) errors.push('address.country is required');

    // Format validations
    if (data.subDomain && !/^[a-z0-9-]+$/.test(data.subDomain)) {
      errors.push('subDomain can only contain lowercase letters, numbers, and hyphens');
    }

    if (data.domainLink && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.domainLink)) {
      errors.push('Invalid domain format');
    }

    // Phone number validations
    if (data.phone && !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (data.whatsapp && !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(data.whatsapp)) {
      errors.push('Invalid WhatsApp number format');
    }

    // Country code validations
    if (data.phoneCountryCode && !/^\+[0-9]{1,4}$/.test(data.phoneCountryCode)) {
      errors.push('Invalid phone country code format');
    }

    if (data.whatsappCountryCode && !/^\+[0-9]{1,4}$/.test(data.whatsappCountryCode)) {
      errors.push('Invalid WhatsApp country code format');
    }

    // Email validation
    if (data.owner?.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.owner.email)) {
      errors.push('Invalid email format');
    }

    // Tax rate validation
    if (data.taxPercentage !== undefined && (data.taxPercentage < 0 || data.taxPercentage > 100)) {
      errors.push('Tax rate must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
