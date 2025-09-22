import mongoose, { Schema, Document } from "mongoose";

export interface IAnalyticsData extends Document {
  metric: string;
  value: number;
  date: string;
  localId?: string;
  subDomain: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDashboardMetrics extends Document {
  subDomain: string;
  localId?: string;
  date: string;
  revenue: IRevenueMetrics;
  orders: IOrderMetrics;
  customers: ICustomerMetrics;
  products: IProductMetrics;
  delivery: IDeliveryMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRevenueMetrics {
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

export interface IOrderMetrics {
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

export interface ICustomerMetrics {
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

export interface IProductMetrics {
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

export interface IDeliveryMetrics {
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

export interface ISalesChart extends Document {
  subDomain: string;
  localId?: string;
  date: string;
  sales: number;
  orders: number;
  customers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalyticsEvent extends Document {
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  localId?: string;
  subDomain: string;
  source: 'web' | 'mobile' | 'api' | 'pos';
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversionFunnel extends Document {
  subDomain: string;
  localId?: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
  }>;
  totalUsers: number;
  completionRate: number;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerJourney extends Document {
  customerId: string;
  subDomain: string;
  localId?: string;
  touchpoints: Array<{
    timestamp: Date;
    channel: string;
    action: string;
    value?: number;
  }>;
  totalValue: number;
  conversionEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

// AnalyticsData Schema
const AnalyticsDataSchema = new Schema<IAnalyticsData>({
  metric: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  value: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// DashboardMetrics Schema
const RevenueMetricsSchema = new Schema<IRevenueMetrics>({
  total: { type: Number, required: true, min: 0 },
  today: { type: Number, required: true, min: 0 },
  yesterday: { type: Number, required: true, min: 0 },
  thisWeek: { type: Number, required: true, min: 0 },
  lastWeek: { type: Number, required: true, min: 0 },
  thisMonth: { type: Number, required: true, min: 0 },
  lastMonth: { type: Number, required: true, min: 0 },
  growth: {
    daily: { type: Number, required: true },
    weekly: { type: Number, required: true },
    monthly: { type: Number, required: true }
  },
  byPaymentMethod: [{
    method: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  byOrderType: [{
    type: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }]
}, { _id: false });

const OrderMetricsSchema = new Schema<IOrderMetrics>({
  total: { type: Number, required: true, min: 0 },
  today: { type: Number, required: true, min: 0 },
  completed: { type: Number, required: true, min: 0 },
  cancelled: { type: Number, required: true, min: 0 },
  pending: { type: Number, required: true, min: 0 },
  averageValue: { type: Number, required: true, min: 0 },
  averageItems: { type: Number, required: true, min: 0 },
  peakHours: [{
    hour: { type: Number, required: true, min: 0, max: 23 },
    count: { type: Number, required: true, min: 0 }
  }],
  byStatus: [{
    status: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  bySource: [{
    source: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }]
}, { _id: false });

const CustomerMetricsSchema = new Schema({
  total: { type: Number, required: true, min: 0 },
  new: { type: Number, required: true, min: 0 },
  returning: { type: Number, required: true, min: 0 },
  retentionRate: { type: Number, required: true, min: 0, max: 100 },
  averageOrderValue: { type: Number, required: true, min: 0 },
  lifetimeValue: { type: Number, required: true, min: 0 },
  topCustomers: [{
    customerId: { type: String, required: true },
    name: { type: String, required: true },
    orderCount: { type: Number, required: true, min: 0 },
    totalSpent: { type: Number, required: true, min: 0 }
  }],
  bySegment: [{
    segment: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }]
}, { _id: false });

const ProductMetricsSchema = new Schema({
  totalProducts: { type: Number, required: true, min: 0 },
  topSelling: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    revenue: { type: Number, required: true, min: 0 }
  }],
  categoryPerformance: [{
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    sales: { type: Number, required: true, min: 0 },
    revenue: { type: Number, required: true, min: 0 }
  }],
  inventory: {
    inStock: { type: Number, required: true, min: 0 },
    outOfStock: { type: Number, required: true, min: 0 },
    lowStock: { type: Number, required: true, min: 0 }
  }
}, { _id: false });

const DeliveryMetricsSchema = new Schema({
  totalDeliveries: { type: Number, required: true, min: 0 },
  averageTime: { type: Number, required: true, min: 0 },
  onTimeDeliveries: { type: Number, required: true, min: 0 },
  delayedDeliveries: { type: Number, required: true, min: 0 },
  failedDeliveries: { type: Number, required: true, min: 0 },
  driverPerformance: [{
    driverId: { type: String, required: true },
    name: { type: String, required: true },
    deliveries: { type: Number, required: true, min: 0 },
    averageTime: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 }
  }],
  zonePerformance: [{
    zoneId: { type: String, required: true },
    name: { type: String, required: true },
    deliveries: { type: Number, required: true, min: 0 },
    averageTime: { type: Number, required: true, min: 0 },
    revenue: { type: Number, required: true, min: 0 }
  }]
}, { _id: false });

const DashboardMetricsSchema = new Schema({
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  revenue: {
    type: RevenueMetricsSchema,
    required: true
  },
  orders: {
    type: OrderMetricsSchema,
    required: true
  },
  customers: {
    type: CustomerMetricsSchema,
    required: true
  },
  products: {
    type: ProductMetricsSchema,
    required: true
  },
  delivery: {
    type: DeliveryMetricsSchema,
    required: true
  }
}, {
  timestamps: true
});

// SalesChart Schema
const SalesChartSchema = new Schema({
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  sales: {
    type: Number,
    required: true,
    min: 0
  },
  orders: {
    type: Number,
    required: true,
    min: 0
  },
  customers: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// AnalyticsEvent Schema
const AnalyticsEventSchema = new Schema({
  eventType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  eventData: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  userId: {
    type: String,
    ref: 'User',
    trim: true
  },
  sessionId: {
    type: String,
    trim: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  source: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'api', 'pos']
  }
}, {
  timestamps: true
});

// ConversionFunnel Schema
const ConversionFunnelSchema = new Schema({
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  steps: [{
    name: { type: String, required: true },
    users: { type: Number, required: true, min: 0 },
    conversionRate: { type: Number, required: true, min: 0, max: 100 }
  }],
  totalUsers: {
    type: Number,
    required: true,
    min: 0
  },
  completionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  date: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// CustomerJourney Schema
const CustomerJourneySchema = new Schema<ICustomerJourney>({
  customerId: {
    type: String,
    required: true,
    trim: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  touchpoints: [{
    timestamp: {
      type: Date,
      required: true
    },
    channel: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: Number,
      min: 0
    }
  }],
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  conversionEvents: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for AnalyticsData
AnalyticsDataSchema.index({ metric: 1 });
AnalyticsDataSchema.index({ date: 1 });
AnalyticsDataSchema.index({ subDomain: 1 });
AnalyticsDataSchema.index({ localId: 1 });
AnalyticsDataSchema.index({ subDomain: 1, date: 1 });
AnalyticsDataSchema.index({ metric: 1, date: 1 });

// Indexes for DashboardMetrics
DashboardMetricsSchema.index({ subDomain: 1 });
DashboardMetricsSchema.index({ localId: 1 });
DashboardMetricsSchema.index({ date: 1 });
DashboardMetricsSchema.index({ subDomain: 1, date: 1 });

// Indexes for SalesChart
SalesChartSchema.index({ subDomain: 1 });
SalesChartSchema.index({ localId: 1 });
SalesChartSchema.index({ date: 1 });
SalesChartSchema.index({ subDomain: 1, date: 1 });

// Indexes for AnalyticsEvent
AnalyticsEventSchema.index({ eventType: 1 });
AnalyticsEventSchema.index({ timestamp: 1 });
AnalyticsEventSchema.index({ subDomain: 1 });
AnalyticsEventSchema.index({ userId: 1 });
AnalyticsEventSchema.index({ sessionId: 1 });
AnalyticsEventSchema.index({ subDomain: 1, timestamp: 1 });

// Indexes for ConversionFunnel
ConversionFunnelSchema.index({ subDomain: 1 });
ConversionFunnelSchema.index({ localId: 1 });
ConversionFunnelSchema.index({ date: 1 });
ConversionFunnelSchema.index({ subDomain: 1, date: 1 });

// Indexes for CustomerJourney
CustomerJourneySchema.index({ customerId: 1 });
CustomerJourneySchema.index({ subDomain: 1 });
CustomerJourneySchema.index({ localId: 1 });
CustomerJourneySchema.index({ subDomain: 1, customerId: 1 });

// Static methods for AnalyticsData
AnalyticsDataSchema.statics.findByMetric = function(metric: string, subDomain?: string) {
  const query: any = { metric };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ date: -1 });
};

AnalyticsDataSchema.statics.findByDateRange = function(startDate: string, endDate: string, subDomain?: string) {
  const query: any = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ date: 1 });
};

// Static methods for DashboardMetrics
DashboardMetricsSchema.statics.findByDate = function(date: string, subDomain?: string) {
  const query: any = { date };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.findOne(query);
};

// Static methods for AnalyticsEvent
AnalyticsEventSchema.statics.findByEventType = function(eventType: string, subDomain?: string) {
  const query: any = { eventType };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ timestamp: -1 });
};

// Static methods for CustomerJourney
CustomerJourneySchema.statics.findByCustomer = function(customerId: string, subDomain?: string) {
  const query: any = { customerId };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.findOne(query);
};

export const AnalyticsData = mongoose.model('AnalyticsData', AnalyticsDataSchema);
export const DashboardMetrics = mongoose.model('DashboardMetrics', DashboardMetricsSchema);
export const SalesChart = mongoose.model('SalesChart', SalesChartSchema);
export const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
export const ConversionFunnel = mongoose.model('ConversionFunnel', ConversionFunnelSchema);
export const CustomerJourney = mongoose.model('CustomerJourney', CustomerJourneySchema);
