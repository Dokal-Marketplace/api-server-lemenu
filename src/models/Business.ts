import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessSettings {
  currency: 'PEN' | 'USD' | 'EUR';
  timezone: string;
  taxRate: number;
  serviceCharge: number;
  deliveryFee: number;
  minOrderValue: number;
  maxDeliveryDistance: number;
  autoAcceptOrders: boolean;
  orderNotifications: boolean;
  paymentMethods: Array<{
    type: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer';
    name: string;
    isActive: boolean;
    config?: Record<string, any>;
  }>;
  features: {
    delivery: boolean;
    pickup: boolean;
    onSite: boolean;
    scheduling: boolean;
    coupons: boolean;
  };
}

export interface IBusinessOwner {
  userId: string;
  name: string;
  email: string;
}

export interface IBusiness extends Document {
  // Core business fields
  name: string;
  description?: string;
  subDomain: string;
  domainLink: string;
  logo?: string;
  coverImage?: string;
  businessId: string;
  
  // Contact information
  phone: string;
  whatsapp: string;
  phoneCountryCode: string;
  whatsappCountryCode: string;
  
  // Business settings
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsOnlinePayment: boolean;
  onlinePaymentOnly: boolean;
  taxPercentage: number;
  isOpenForDelivery: boolean;
  isOpenForPickup: boolean;
  
  // User and status
  userId: string; // Reference to User who created the business
  isActive: boolean;
  status: 'active' | 'inactive' | 'suspended';
  
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
  
  // Settings and relationships
  settings: IBusinessSettings;
  locations: string[]; // Array of BusinessLocation IDs
  owner: IBusinessOwner;
  createdAt: Date;
  updatedAt: Date;
}

// BusinessSettings Schema
const BusinessSettingsSchema = new Schema<IBusinessSettings>({
  currency: {
    type: String,
    required: false,
    enum: ['PEN', 'USD', 'EUR', 'XOF'],
    default: 'PEN'
  },
  timezone: {
    type: String,
    required: true,
    default: 'America/Lima'
  },
  taxRate: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 18
  },
  serviceCharge: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  minOrderValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxDeliveryDistance: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  autoAcceptOrders: {
    type: Boolean,
    default: false
  },
  orderNotifications: {
    type: Boolean,
    default: true
  },
  paymentMethods: [{
    type: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'digital_wallet', 'bank_transfer']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    config: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],
  features: {
    delivery: { type: Boolean, default: true },
    pickup: { type: Boolean, default: true },
    onSite: { type: Boolean, default: false },
    scheduling: { type: Boolean, default: false },
    coupons: { type: Boolean, default: false }
  }
}, { _id: false });

// BusinessOwner Schema
const BusinessOwnerSchema = new Schema<IBusinessOwner>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }
}, { _id: false });

const BusinessSchema = new Schema<IBusiness>({
  // Core business fields
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  subDomain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  domainLink: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 60,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
      },
      message: 'Invalid domain format'
    }
  },
  logo: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Logo URL must be a valid URL'
    }
  },
  coverImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Cover image URL must be a valid URL'
    }
  },
  businessId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Contact information
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid phone number']
  },
  whatsapp: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid WhatsApp number']
  },
  phoneCountryCode: {
    type: String,
    required: true,
    trim: true,
    default: '+51',
    match: [/^\+[0-9]{1,4}$/, 'Invalid country code format']
  },
  whatsappCountryCode: {
    type: String,
    required: true,
    trim: true,
    default: '+51',
    match: [/^\+[0-9]{1,4}$/, 'Invalid country code format']
  },
  
  // Business settings
  acceptsDelivery: {
    type: Boolean,
    default: true
  },
  acceptsPickup: {
    type: Boolean,
    default: true
  },
  acceptsOnlinePayment: {
    type: Boolean,
    default: true
  },
  onlinePaymentOnly: {
    type: Boolean,
    default: false
  },
  taxPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 18
  },
  isOpenForDelivery: {
    type: Boolean,
    default: true
  },
  isOpenForPickup: {
    type: Boolean,
    default: true
  },
  
  // User and status
  userId: {
    type: String,
    required: true,
    ref: 'User',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    required: false,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Address information
  address: {
    street: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  
  // Settings and relationships
  settings: {
    type: BusinessSettingsSchema,
    required: false,
    default: {}
  },
  locations: [{
    type: String,
    ref: 'BusinessLocation',
    trim: true
  }],
  owner: {
    type: BusinessOwnerSchema,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BusinessSchema.index({ userId: 1 });
BusinessSchema.index({ isActive: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ businessId: 1 });
BusinessSchema.index({ subDomain: 1 });
BusinessSchema.index({ 'address.city': 1, 'address.state': 1, 'address.country': 1 });
BusinessSchema.index({ acceptsDelivery: 1 });
BusinessSchema.index({ acceptsPickup: 1 });
BusinessSchema.index({ acceptsOnlinePayment: 1 });
BusinessSchema.index({ isOpenForDelivery: 1 });
BusinessSchema.index({ isOpenForPickup: 1 });
BusinessSchema.index({ 'owner.userId': 1 });
BusinessSchema.index({ 'settings.currency': 1 });
BusinessSchema.index({ 'address.city': 1 });
BusinessSchema.index({ 'address.state': 1 });
BusinessSchema.index({ 'address.country': 1 });

// Text search index for business search
BusinessSchema.index({ 
  name: 'text',
  description: 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text',
  'address.country': 'text'
});

// Pre-save middleware to generate businessId if not provided
BusinessSchema.pre('save', function(this: any, next: any) {
  if (!this.businessId) {
    this.businessId = `BIZ${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Virtual for full phone number
BusinessSchema.virtual('fullPhoneNumber').get(function(this: any) {
  return `${this.phoneCountryCode} ${this.phone}`;
});

// Virtual for full WhatsApp number
BusinessSchema.virtual('fullWhatsAppNumber').get(function(this: any) {
  return `${this.whatsappCountryCode} ${this.whatsapp}`;
});

// Virtual for full address
BusinessSchema.virtual('fullAddress').get(function(this: any) {
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.country}`;
});

// Ensure virtual fields are serialized
BusinessSchema.set('toJSON', { virtuals: true });
BusinessSchema.set('toObject', { virtuals: true });

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);
