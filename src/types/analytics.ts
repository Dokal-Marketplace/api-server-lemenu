import { BaseEntity } from './common';

export interface AnalyticsData extends BaseEntity {
  metric: string;
  value: number;
  date: string;
  localId?: string;
  subDomain: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  customers: CustomerMetrics;
  products: ProductMetrics;
  delivery: DeliveryMetrics;
}

export interface RevenueMetrics {
  total: number;
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  byOrderType: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
}

export interface OrderMetrics {
  total: number;
  today: number;
  completed: number;
  cancelled: number;
  pending: number;
  averageValue: number;
  averageItems: number;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  bySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

export interface CustomerMetrics {
  total: number;
  new: number;
  returning: number;
  retentionRate: number;
  averageOrderValue: number;
  lifetimeValue: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    orderCount: number;
    totalSpent: number;
  }>;
  bySegment: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export interface ProductMetrics {
  totalProducts: number;
  topSelling: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    categoryId: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  inventory: {
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  averageTime: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
  failedDeliveries: number;
  driverPerformance: Array<{
    driverId: string;
    name: string;
    deliveries: number;
    averageTime: number;
    rating: number;
  }>;
  zonePerformance: Array<{
    zoneId: string;
    name: string;
    deliveries: number;
    averageTime: number;
    revenue: number;
  }>;
}

export interface SalesChart {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  localId?: string;
  productIds?: string[];
  categoryIds?: string[];
  orderTypes?: string[];
  paymentMethods?: string[];
  customerSegments?: string[];
}

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  filters: AnalyticsFilters;
  includeSections: ReportSection[];
  recipient?: {
    email: string;
    name: string;
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
  };
}

export type ReportType = 
  | 'sales' 
  | 'inventory' 
  | 'customer' 
  | 'delivery' 
  | 'staff' 
  | 'financial';

export type ReportFormat = 
  | 'pdf' 
  | 'excel' 
  | 'csv' 
  | 'json';

export type ReportSection = 
  | 'summary' 
  | 'charts' 
  | 'detailed_data' 
  | 'comparisons' 
  | 'recommendations';

export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  localId?: string;
  source: 'web' | 'mobile' | 'api' | 'pos';
}

export interface ConversionFunnel {
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
  }>;
  totalUsers: number;
  completionRate: number;
}

export interface CustomerJourney {
  customerId: string;
  touchpoints: Array<{
    timestamp: string;
    channel: string;
    action: string;
    value?: number;
  }>;
  totalValue: number;
  conversionEvents: string[];
}