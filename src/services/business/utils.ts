// types/businessTypes.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  errors?: string[] | any[];
  error?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BusinessSearchFilters {
  search?: string;
  departamento?: string;
  localDepartamento?: string;
  localProvincia?: string;
  localDistrito?: string;
  localAceptaRecojo?: boolean;
  localAceptaDelivery?: boolean;
  provincia?: string;
  distrito?: string;
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// utils/businessUtils.ts
import { Request } from 'express';

/**
 * Extract and validate query parameters for business searches
 */
export const extractBusinessFilters = (req: Request): BusinessSearchFilters => {
const {
  search,
  departamento,
  provincia,
  distrito,
  acceptsDelivery,
  acceptsPickup,
  isActive,
  status,
  userId,
  page = '1',
  limit = '10',
  sortBy = 'createdAt',
  sortOrder = 'desc'
} = req.query;

return {
  search: search as string,
  localDepartamento: departamento as string,
  localProvincia: provincia as string,
  localDistrito: distrito as string,
  localAceptaDelivery: acceptsDelivery !== undefined ? acceptsDelivery === 'true' : undefined,
  localAceptaRecojo: acceptsPickup !== undefined ? acceptsPickup === 'true' : undefined,
  isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  status: status as 'active' | 'inactive' | 'suspended',
  userId: userId as string,
  page: parseInt(page as string) || 1,
  limit: Math.min(parseInt(limit as string) || 10, 100), // Max 100 items per page
  sortBy: sortBy as string,
  sortOrder: sortOrder as 'asc' | 'desc'
};
};

/**
 * Generate a unique business localId
 */
export const generateLocalId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `LOC${timestamp}${random}`;
};

/**
 * Format phone number with country code
 */
export const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  return `${countryCode} ${phoneNumber}`;
};

/**
 * Validate subdomain format
 */
export const isValidSubdomain = (subdomain: string): boolean => {
  return /^[a-z0-9-]+$/.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 20;
};

/**
 * Validate domain format
 */
export const isValidDomain = (domain: string): boolean => {
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(phoneNumber);
};

/**
 * Validate country code format
 */
export const isValidCountryCode = (countryCode: string): boolean => {
  return /^\+[0-9]{1,4}$/.test(countryCode);
};

/**
 * Sanitize business data for response (remove sensitive fields if needed)
 */
export const sanitizeBusinessData = (business: any): any => {
  // Remove or transform any sensitive data before sending to client
  // For now, we'll return the business as is, but you can customize this
  
  // Example: Remove internal IDs or sensitive owner information
  const sanitized = { ...business };
  
  // You might want to remove or transform certain fields:
  // delete sanitized.owner?.userId; // Remove internal user references
  // sanitized.owner = { name: sanitized.owner?.name, email: sanitized.owner?.email };
  
  return sanitized;
};

/**
 * Generate full address string
 */
export const generateFullAddress = (business: any): string => {
  if (business.address) {
    return `${business.address.street}, ${business.address.city}, ${business.address.state}, ${business.address.country}`;
  }
  return `${business.localDireccion}, ${business.localDistrito}, ${business.localProvincia}, ${business.localDepartamento}`;
};

/**
 * Check if business is currently open based on business hours (if implemented)
 */
export const isBusinessOpen = (business: any): { delivery: boolean; pickup: boolean } => {
  // This is a simple implementation. You might want to add more complex logic
  // considering business hours, holidays, etc.
  return {
    delivery: business.estaAbiertoParaDelivery && business.localAceptaDelivery && business.isActive,
    pickup: business.estaAbiertoParaRecojo && business.localAceptaRecojo && business.isActive
  };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Filter businesses by delivery distance
 */
export const filterByDeliveryDistance = (
  businesses: any[],
  customerLat: number,
  customerLon: number
): any[] => {
  return businesses.filter(business => {
    if (!business.address?.coordinates) return true; // Include if no coordinates
    
    const distance = calculateDistance(
      customerLat,
      customerLon,
      business.address.coordinates.latitude,
      business.address.coordinates.longitude
    );
    
    return distance <= (business.settings?.maxDeliveryDistance || 10);
  });
};

/**
 * Error handler for business operations
 */
export const handleBusinessError = (error: any): { statusCode: number; message: string } => {
  console.error('Business operation error:', error);
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error: ' + Object.values(error.errors).map((e: any) => e.message).join(', ')
    };
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      statusCode: 409,
      message: `${field} already exists`
    };
  }
  
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format'
    };
  }
  
  if (error.message.includes('not found')) {
    return {
      statusCode: 404,
      message: error.message
    };
  }
  
  return {
    statusCode: 500,
    message: 'Internal server error'
  };
};