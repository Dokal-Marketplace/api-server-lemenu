import { BaseEntity, ContactInfo, Address, Status } from './common';

export interface DeliveryCompany extends BaseEntity, ContactInfo {
  name: string;
  description?: string;
  logo?: string;
  status: Status;
  commission: number; // percentage
  deliveryFee: number;
  minOrderValue: number;
  coverageAreas: string[];
  operatingHours: {
    start: string;
    end: string;
  };
  settings: DeliveryCompanySettings;
}

export interface DeliveryCompanySettings {
  allowCashPayment: boolean;
  allowCardPayment: boolean;
  providesInsurance: boolean;
  trackingAvailable: boolean;
  estimatedDeliveryTime: number; // minutes
  maxDeliveryDistance: number; // km
  vehicleTypes: VehicleType[];
}

export interface Driver extends BaseEntity, ContactInfo {
  name: string;
  dni: string;
  licenseNumber: string;
  licenseType: string;
  vehicleType: VehicleType;
  vehicleInfo: VehicleInfo;
  companyId?: string;
  status: DriverStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdate: string;
  };
  availability: DriverAvailability;
  ratings: {
    average: number;
    totalRatings: number;
  };
  stats: DriverStats;
}

export interface VehicleInfo {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  insurance?: {
    company: string;
    policyNumber: string;
    expiryDate: string;
  };
}

export interface DriverAvailability {
  isAvailable: boolean;
  workingHours: {
    [day: string]: {
      start: string;
      end: string;
    } | null;
  };
  maxOrdersPerHour: number;
  currentOrders: number;
}

export interface DriverStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number; // minutes
  totalEarnings: number;
  monthlyEarnings: number;
}

export type VehicleType = 
  | 'motorcycle' 
  | 'bicycle' 
  | 'car' 
  | 'van' 
  | 'truck';

export type DriverStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended' 
  | 'on_delivery' 
  | 'offline';

export interface DeliveryOrder {
  orderId: string;
  driverId?: string;
  companyId?: string;
  status: DeliveryStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  deliveryInstructions?: string;
  trackingCode?: string;
  deliveryProof?: {
    type: 'photo' | 'signature' | 'code';
    data: string;
  };
}

export type DeliveryStatus = 
  | 'assigned' 
  | 'pickup_pending' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export interface DeliveryZoneConfig {
  id: string;
  name: string;
  type: 'polygon' | 'radius';
  coordinates: number[][];
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // km
  deliveryFee: number;
  minOrderValue: number;
  estimatedTime: number; // minutes
  isActive: boolean;
  restrictions?: {
    maxWeight: number;
    allowedVehicles: VehicleType[];
    timeSlots: Array<{
      start: string;
      end: string;
    }>;
  };
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveries: number;
  customerRating: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}