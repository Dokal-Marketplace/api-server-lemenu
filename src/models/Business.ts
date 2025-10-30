import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessSettings {
  currency: 'PEN' | 'USD' | 'EUR' | 'XOF'; // ✅ FIXED: Added XOF
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
  
  // Meta / WhatsApp identifiers (optional)
  wabaId?: string; // WhatsApp Business Account ID
  fbBusinessId?: string; // Facebook Business Manager ID
  fbPageIds?: string[];
  fbCatalogIds?: string[];
  fbDatasetIds?: string[];
  instagramAccountIds?: string[];
  whatsappPhoneNumberIds?: string[];
  
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
  isOpenForDelivery: boolean;
  isOpenForPickup: boolean;
  
  // User and status
  userId: string;
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
  locations: string[];
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
    required: false, // ✅ Changed from true to false with default
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
    required: false, // ✅ Changed from true to false
    min: 0,
    default: 0
  },
  maxDeliveryDistance: {
    type: Number,
    required: false, // ✅ Changed from true to false
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
  paymentMethods: {
    type: [{
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
    default: [{ // ✅ Added default payment method
      type: 'cash',
      name: 'Efectivo',
      isActive: true
    }]
  },
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
    required: [true, 'Business name is required'], // ✅ Added error message
    trim: true,
    maxlength: [200, 'Business name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subDomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  domainLink: {
    type: String,
    required: [true, 'Domain link is required'],
    trim: true,
    minlength: [3, 'Domain must be at least 3 characters'],
    maxlength: [60, 'Domain cannot exceed 60 characters'],
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
    unique: true,
    sparse: true, // ✅ IMPORTANT: Allows null/undefined before pre-save
    trim: true
  },
  
  // Meta / WhatsApp identifiers
  wabaId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  fbBusinessId: {
    type: String,
    required: false,
    trim: true
  },
  fbPageIds: {
    type: [String],
    required: false,
    default: []
  },
  fbCatalogIds: {
    type: [String],
    required: false,
    default: []
  },
  fbDatasetIds: {
    type: [String],
    required: false,
    default: []
  },
  instagramAccountIds: {
    type: [String],
    required: false,
    default: []
  },
  whatsappPhoneNumberIds: {
    type: [String],
    required: false,
    default: []
  },
  
  // Contact information
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
    match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid phone number']
  },
  whatsapp: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    trim: true,
    maxlength: [20, 'WhatsApp number cannot exceed 20 characters'],
    match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid WhatsApp number']
  },
  phoneCountryCode: {
    type: String,
    required: false, // ✅ Changed to false with default
    trim: true,
    default: '+51',
    match: [/^\+[0-9]{1,4}$/, 'Invalid country code format']
  },
  whatsappCountryCode: {
    type: String,
    required: false, // ✅ Changed to false with default
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
    required: [true, 'User ID is required'],
    ref: 'User',
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  status: {
    type: String,
    required: false,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Address information - ✅ FIXED: Made required fields consistent
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'], // ✅ FIXED
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'], // ✅ FIXED
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'], // ✅ FIXED
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
      index: true
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'], // ✅ FIXED
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      index: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  
  // Settings and relationships
  settings: {
    type: BusinessSettingsSchema,
    required: false,
    default: () => ({}) // ✅ Use function to avoid reference issues
  },
  locations: {
    type: [{
      type: String,
      ref: 'BusinessLocation',
      trim: true
    }],
    default: []
  },
  owner: {
    type: BusinessOwnerSchema,
    required: [true, 'Business owner information is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
BusinessSchema.index({ userId: 1, isActive: 1 });
BusinessSchema.index({ subDomain: 1 }, { unique: true });
BusinessSchema.index({ businessId: 1 }, { unique: true, sparse: true });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ 'address.city': 1, 'address.state': 1, 'address.country': 1 });
BusinessSchema.index({ acceptsDelivery: 1, isActive: 1 });
BusinessSchema.index({ acceptsPickup: 1, isActive: 1 });
BusinessSchema.index({ 'owner.userId': 1 });

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
BusinessSchema.pre('save', function(next) {
  if (!this.businessId) {
    this.businessId = `BIZ${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Virtual for full phone number
BusinessSchema.virtual('fullPhoneNumber').get(function() {
  return `${this.phoneCountryCode} ${this.phone}`;
});

// Virtual for full WhatsApp number
BusinessSchema.virtual('fullWhatsAppNumber').get(function() {
  return `${this.whatsappCountryCode} ${this.whatsapp}`;
});

// Virtual for full address
BusinessSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.country}`;
});

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);