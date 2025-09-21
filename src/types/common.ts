
export interface BaseEntity {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface ApiResponse<T = any> {
    type: string;
    success: boolean;
    message: string;
    data: T;
  }
  
  export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
  }
  
  export interface Location {
    latitude: number;
    longitude: number;
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: Location;
  }
  
  export interface ContactInfo {
    phone: string;
    email: string;
    whatsapp?: string;
  }
  
  export interface TimeSlot {
    start: string; // HH:MM format
    end: string; // HH:MM format
  }
  
  export interface Schedule {
    [day: string]: TimeSlot[] | null; // null means closed
  }
  
  export type Status = 'active' | 'inactive' | 'suspended';
  export type Currency = 'PEN' | 'USD' | 'EUR';