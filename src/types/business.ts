import { BaseEntity, Address, ContactInfo, Schedule, Status, Currency } from './common';

export interface Business extends BaseEntity, ContactInfo {
  name: string;
  description?: string;
  subDomain: string;
  logo?: string;
  coverImage?: string;
  address: Address;
  status: Status;
  settings: BusinessSettings;
  locations: BusinessLocation[];
  owner: {
    userId: string;
    name: string;
    email: string;
  };
}

export interface BusinessLocation extends BaseEntity {
  localId: string;
  name: string;
  description?: string;
  address: Address;
  phone: string;
  email?: string;
  status: Status;
  schedule: Schedule;
  deliveryZones: DeliveryZone[];
  settings: LocationSettings;
}

export interface BusinessSettings {
  currency: Currency;
  timezone: string;
  taxRate: number;
  serviceCharge: number;
  deliveryFee: number;
  minOrderValue: number;
  maxDeliveryDistance: number;
  autoAcceptOrders: boolean;
  orderNotifications: boolean;
  paymentMethods: PaymentMethod[];
  features: {
    delivery: boolean;
    pickup: boolean;
    onSite: boolean;
    scheduling: boolean;
    coupons: boolean;
  };
}

export interface LocationSettings {
  allowDelivery: boolean;
  allowPickup: boolean;
  allowOnSite: boolean;
  deliveryHours: Schedule;
  pickupHours: Schedule;
  onSiteHours: Schedule;
  kitchenCloseOffset: number; // minutes before closing
}

export interface DeliveryZone extends BaseEntity {
  name: string;
  description?: string;
  type: 'polygon' | 'circle';
  coordinates: number[][];
  deliveryFee: number;
  minOrderValue: number;
  estimatedDeliveryTime: number; // minutes
  isActive: boolean;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer';
  name: string;
  isActive: boolean;
  config?: Record<string, any>;
}

export interface BusinessMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerCount: number;
  deliveryOrders: number;
  pickupOrders: number;
  onSiteOrders: number;
  periodComparison: {
    orders: number; // percentage change
    revenue: number; // percentage change
  };
}