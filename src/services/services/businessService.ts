// services/businessService.ts
import { Business, IBusiness } from '../../models/Business';

export interface CreateBusinessInput {
  // Legacy fields
  subdominio: string;
  linkDominio: string;
  localNombreComercial: string;
  localDescripcion?: string;
  localDireccion: string;
  localDepartamento: string;
  localProvincia: string;
  localDistrito: string;
  localTelefono: string;
  localWpp: string;
  phoneCountryCode?: string;
  wppCountryCode?: string;
  localAceptaDelivery?: boolean;
  localAceptaRecojo?: boolean;
  localAceptaPagoEnLinea?: boolean;
  localSoloPagoEnLinea?: boolean;
  localPorcentajeImpuesto?: number;
  userId: string;
  
  // New fields
  name: string;
  description?: string;
  subDomain: string;
  logo?: string;
  coverImage?: string;
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
  owner: {
    userId: string;
    name: string;
    email: string;
  };
  settings?: Partial<IBusiness['settings']>;
}

export interface UpdateBusinessInput {
  localNombreComercial?: string;
  localDescripcion?: string;
  localDireccion?: string;
  localDepartamento?: string;
  localProvincia?: string;
  localDistrito?: string;
  localTelefono?: string;
  localWpp?: string;
  phoneCountryCode?: string;
  wppCountryCode?: string;
  localAceptaDelivery?: boolean;
  localAceptaRecojo?: boolean;
  localAceptaPagoEnLinea?: boolean;
  localSoloPagoEnLinea?: boolean;
  localPorcentajeImpuesto?: number;
  estaAbiertoParaDelivery?: boolean;
  estaAbiertoParaRecojo?: boolean;
  isActive?: boolean;
  
  // New fields
  name?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address?: Partial<IBusiness['address']>;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<IBusiness['settings']>;
}

export interface BusinessQueryFilters {
  userId?: string;
  subdominio?: string;
  subDomain?: string;
  localId?: string;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  localDepartamento?: string;
  localProvincia?: string;
  localDistrito?: string;
  localAceptaDelivery?: boolean;
  localAceptaRecojo?: boolean;
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
      // Rely on unique index; duplicate key (11000) is handled below.

      // Set default settings if not provided
      const defaultSettings = {
        currency: 'PEN' as const,
        timezone: 'America/Lima',
        taxRate: data.localPorcentajeImpuesto || 18,
        serviceCharge: 0,
        deliveryFee: 0,
        minOrderValue: 0,
        maxDeliveryDistance: 10,
        autoAcceptOrders: false,
        orderNotifications: true,
        paymentMethods: [
          {
            type: 'cash' as const,
            name: 'Efectivo',
            isActive: true
          }
        ],
        features: {
          delivery: data.localAceptaDelivery ?? true,
          pickup: data.localAceptaRecojo ?? true,
          onSite: false,
          scheduling: false,
          coupons: false
        }
      };

      const businessData = {
        ...data,
        phoneCountryCode: data.phoneCountryCode || '+51',
        wppCountryCode: data.wppCountryCode || '+51',
        localAceptaDelivery: data.localAceptaDelivery ?? true,
        localAceptaRecojo: data.localAceptaRecojo ?? true,
        localAceptaPagoEnLinea: data.localAceptaPagoEnLinea ?? true,
        localSoloPagoEnLinea: data.localSoloPagoEnLinea ?? false,
        localPorcentajeImpuesto: data.localPorcentajeImpuesto ?? 18,
        estaAbiertoParaDelivery: true,
        estaAbiertoParaRecojo: true,
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
      const query: any = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.subdominio) query.subdominio = filters.subdominio;
      if (filters.subDomain) query.subDomain = filters.subDomain;
      if (filters.localId) query.localId = filters.localId;
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
      const [businesses, total] = await Promise.all([
        Business.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
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

      if (filters.localDepartamento) query.localDepartamento = filters.localDepartamento;
      if (filters.localProvincia) query.localProvincia = filters.localProvincia;
      if (filters.localDistrito) query.localDistrito = filters.localDistrito;
      if (filters.localAceptaDelivery !== undefined) query.localAceptaDelivery = filters.localAceptaDelivery;
      if (filters.localAceptaRecojo !== undefined) query.localAceptaRecojo = filters.localAceptaRecojo;
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
    identifierType: 'id' | 'subdominio' | 'subDomain' | 'localId' = 'id'
  ): Promise<IBusiness | null> {
    try {
      const query: any = {};
      
      switch (identifierType) {
        case 'subdominio':
          query.subdominio = identifier;
          break;
        case 'subDomain':
          query.subDomain = identifier;
          break;
        case 'localId':
          query.localId = identifier;
          break;
        default:
          query._id = identifier;
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
    identifierType: 'id' | 'subdominio' | 'subDomain' | 'localId' = 'id'
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
      estaAbiertoParaDelivery?: boolean;
      estaAbiertoParaRecojo?: boolean;
    },
    identifierType: 'id' | 'subdominio' | 'subDomain' | 'localId' = 'id'
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
    departamento?: string,
    provincia?: string,
    distrito?: string,
    options: { page?: number; limit?: number } = {}
  ) {
    try {
      const filters: BusinessQueryFilters = {
        isActive: true,
        status: 'active',
        ...options
      };

      if (departamento) filters.localDepartamento = departamento;
      if (provincia) filters.localProvincia = provincia;
      if (distrito) filters.localDistrito = distrito;

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
    if (!data.subdominio) errors.push('subdominio is required');
    if (!data.subDomain) errors.push('subDomain is required');
    if (!data.localNombreComercial) errors.push('localNombreComercial is required');
    if (!data.name) errors.push('name is required');
    if (!data.userId) errors.push('userId is required');

    // Format validations
    if (data.subdominio && !/^[a-z0-9-]+$/.test(data.subdominio)) {
      errors.push('subdominio can only contain lowercase letters, numbers, and hyphens');
    }

    if (data.subDomain && !/^[a-z0-9-]+$/.test(data.subDomain)) {
      errors.push('subDomain can only contain lowercase letters, numbers, and hyphens');
    }

    if (data.linkDominio && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.linkDominio)) {
      errors.push('Invalid domain format');
    }

    // Phone number validations
    if (data.localTelefono && !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(data.localTelefono)) {
      errors.push('Invalid phone number format');
    }

    if (data.localWpp && !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(data.localWpp)) {
      errors.push('Invalid WhatsApp number format');
    }

    // Country code validations
    if (data.phoneCountryCode && !/^\+[0-9]{1,4}$/.test(data.phoneCountryCode)) {
      errors.push('Invalid phone country code format');
    }

    if (data.wppCountryCode && !/^\+[0-9]{1,4}$/.test(data.wppCountryCode)) {
      errors.push('Invalid WhatsApp country code format');
    }

    // Email validation
    if (data.owner?.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.owner.email)) {
      errors.push('Invalid email format');
    }

    // Tax rate validation
    if (data.localPorcentajeImpuesto !== undefined && (data.localPorcentajeImpuesto < 0 || data.localPorcentajeImpuesto > 100)) {
      errors.push('Tax rate must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}