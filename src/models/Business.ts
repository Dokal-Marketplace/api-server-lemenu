import mongoose, { Schema, Document } from "mongoose";
import { encrypt, decrypt } from "../utils/encryption";
import logger from "../utils/logger";

export interface IBusinessSettings {
  currency: 'PEN' | 'USD' | 'EUR' | 'XOF';
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
  wabaId?: string;
  fbBusinessId?: string;
  businessManagerId?: string; // Alias for fbBusinessId - Meta Business Manager ID
  fbPageIds?: string[];
  fbCatalogIds?: string[];
  fbDatasetIds?: string[];
  instagramAccountIds?: string[];
  whatsappPhoneNumberIds?: string[];
  whatsappAccessToken?: string;
  whatsappTokenExpiresAt?: Date;
  whatsappRefreshToken?: string;
  
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
  // Credits and billing
  creditsTotal?: number;
  creditsUsed?: number;
  overdraftLimit?: number;
  autoTopUp?: {
    enabled: boolean;
    packCode?: string;
    triggerThreshold: number;
  };
  lowBalanceThresholds?: number[];
  cancellationGraceMinutes?: number;
  // WhatsApp migration tracking
  whatsappMigrationHistory?: Array<{
    oldWabaId?: string;
    newWabaId: string;
    oldPhoneNumberIds?: string[];
    newPhoneNumberIds: string[];
    migratedAt: Date;
    migratedBy?: string;
    status: 'pending' | 'completed' | 'failed' | 'rolled_back';
    validationResults?: any;
    error?: string;
  }>;
  // WhatsApp template tracking
  whatsappTemplates?: Array<{
    name: string;
    templateId?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED';
    createdAt: Date;
    approvedAt?: Date;
    language: string;
    category: string;
  }>;
  templatesProvisioned?: boolean;
  templatesProvisionedAt?: Date;
  // WhatsApp activation flag
  whatsappEnabled?: boolean;
  // Catalog sync settings
  catalogSyncEnabled?: boolean;
  catalogSyncSchedule?: 'manual' | 'realtime' | 'daily';
  lastCatalogSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to normalize date fields from extended JSON format
const normalizeDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  
  // If it's already a Date object, return it
  if (value instanceof Date) {
    return value;
  }
  
  // If it's in MongoDB extended JSON format { '$date': '...' }
  if (typeof value === 'object' && value.$date) {
    return new Date(value.$date);
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // If it's a number (timestamp), convert it
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  return undefined;
};

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
    required: false,
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
    required: false,
    min: 0,
    default: 0
  },
  maxDeliveryDistance: {
    type: Number,
    required: false,
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
    default: [{
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
    required: [true, 'Business name is required'],
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
    sparse: true,
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
  businessManagerId: {
    type: String,
    required: false,
    trim: true,
    index: true
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
  // WhatsApp Business API tokens (encrypted)
  whatsappAccessToken: {
    type: String,
    required: false,
    default: null
  },
  whatsappTokenExpiresAt: {
    type: Date,
    required: false,
    default: null
  },
  whatsappRefreshToken: {
    type: String,
    required: false,
    default: null
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
    required: false,
    trim: true,
    default: '+51',
    match: [/^\+[0-9]{1,4}$/, 'Invalid country code format']
  },
  whatsappCountryCode: {
    type: String,
    required: false,
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
  
  // Address information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
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
      required: [true, 'Country is required'],
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
    default: () => ({})
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
  },
  
  // Credits and billing
  creditsTotal: {
    type: Number,
    required: false,
    default: 0
  },
  creditsUsed: {
    type: Number,
    required: false,
    default: 0
  },
  overdraftLimit: {
    type: Number,
    required: false,
    default: 5,
    min: 0,
  },
  autoTopUp: {
    enabled: { type: Boolean, default: false },
    packCode: { type: String },
    triggerThreshold: { type: Number, default: 10, min: 0 },
  },
  lowBalanceThresholds: {
    type: [Number],
    default: [20, 5, 0]
  },
  cancellationGraceMinutes: {
    type: Number,
    default: 15,
    min: 0
  },
  // WhatsApp migration tracking
  whatsappMigrationHistory: {
    type: [{
      oldWabaId: { type: String },
      newWabaId: { type: String, required: true },
      oldPhoneNumberIds: { type: [String] },
      newPhoneNumberIds: { type: [String], required: true },
      migratedAt: { type: Date, required: true, default: Date.now },
      migratedBy: { type: String },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'rolled_back'],
        required: true,
        default: 'pending'
      },
      validationResults: { type: Schema.Types.Mixed },
      error: { type: String }
    }],
    default: []
  },
  // WhatsApp template tracking
  whatsappTemplates: {
    type: [{
      name: { type: String, required: true },
      templateId: { type: String },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED'],
        default: 'PENDING'
      },
      createdAt: { type: Date, required: true, default: Date.now },
      approvedAt: { type: Date },
      language: { type: String, required: true },
      category: { type: String, required: true }
    }],
    default: []
  },
  templatesProvisioned: {
    type: Boolean,
    default: false
  },
  templatesProvisionedAt: {
    type: Date
  },
  whatsappEnabled: {
    type: Boolean,
    default: false
  },
  catalogSyncEnabled: {
    type: Boolean,
    default: true
  },
  catalogSyncSchedule: {
    type: String,
    enum: ['manual', 'realtime', 'daily'],
    default: 'realtime'
  },
  lastCatalogSyncAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================
// CRITICAL FIX: Pre-init hook
// ===========================
// This hook runs BEFORE Mongoose initializes the document, allowing us to
// normalize dates from MongoDB Extended JSON format BEFORE validation runs.
// This is the ONLY place where we can intercept and transform the raw data
// before Mongoose tries to cast it to Date types.

BusinessSchema.pre('init', function (this: any, doc: any) {
  try {
    // Normalize createdAt if it's in extended JSON format
    if (doc.createdAt && typeof doc.createdAt === 'object' && doc.createdAt !== null && doc.createdAt.$date) {
      doc.createdAt = normalizeDate(doc.createdAt);
      logger.debug('Normalized createdAt in pre-init', { 
        from: 'Extended JSON', 
        to: doc.createdAt 
      });
    }
    
    // Normalize updatedAt if it's in extended JSON format
    if (doc.updatedAt && typeof doc.updatedAt === 'object' && doc.updatedAt !== null && doc.updatedAt.$date) {
      doc.updatedAt = normalizeDate(doc.updatedAt);
      logger.debug('Normalized updatedAt in pre-init', { 
        from: 'Extended JSON', 
        to: doc.updatedAt 
      });
    }
    
    // Also normalize nested date fields in whatsappMigrationHistory
    if (doc.whatsappMigrationHistory && Array.isArray(doc.whatsappMigrationHistory)) {
      doc.whatsappMigrationHistory.forEach((migration: any) => {
        if (migration.migratedAt && typeof migration.migratedAt === 'object' && migration.migratedAt.$date) {
          migration.migratedAt = normalizeDate(migration.migratedAt);
        }
      });
    }
    
    // Normalize nested date fields in whatsappTemplates
    if (doc.whatsappTemplates && Array.isArray(doc.whatsappTemplates)) {
      doc.whatsappTemplates.forEach((template: any) => {
        if (template.createdAt && typeof template.createdAt === 'object' && template.createdAt.$date) {
          template.createdAt = normalizeDate(template.createdAt);
        }
        if (template.approvedAt && typeof template.approvedAt === 'object' && template.approvedAt.$date) {
          template.approvedAt = normalizeDate(template.approvedAt);
        }
      });
    }
    
    // Normalize other date fields
    if (doc.whatsappTokenExpiresAt && typeof doc.whatsappTokenExpiresAt === 'object' && doc.whatsappTokenExpiresAt.$date) {
      doc.whatsappTokenExpiresAt = normalizeDate(doc.whatsappTokenExpiresAt);
    }
    
    if (doc.templatesProvisionedAt && typeof doc.templatesProvisionedAt === 'object' && doc.templatesProvisionedAt.$date) {
      doc.templatesProvisionedAt = normalizeDate(doc.templatesProvisionedAt);
    }
  } catch (err) {
    logger.error('Error normalizing date fields in pre-init hook:', err, {
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }
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

// Pre-save validation: WhatsApp is required only when WhatsApp is being enabled
BusinessSchema.pre('save', function(next) {
  const isEnablingWhatsApp = this.isModified('whatsappEnabled') && this.whatsappEnabled === true;
  const isModifyingWhatsAppConfig = this.whatsappEnabled === true && (
    this.isModified('wabaId') || 
    this.isModified('whatsappPhoneNumberIds') || 
    this.isModified('whatsappAccessToken')
  );
  
  if (isEnablingWhatsApp || isModifyingWhatsAppConfig) {
    if (this.isActive === true) {
      if (!this.wabaId) {
        return next(new Error('WhatsApp Business Account ID (wabaId) is required when WhatsApp is enabled'));
      }
      if (!this.whatsappPhoneNumberIds || this.whatsappPhoneNumberIds.length === 0) {
        return next(new Error('WhatsApp phone number IDs are required when WhatsApp is enabled'));
      }
      if (!this.whatsappAccessToken) {
        return next(new Error('WhatsApp access token is required when WhatsApp is enabled'));
      }
    }
  }
  next();
});

// Post-save hook: Auto-provision templates when WABA is first linked
BusinessSchema.post('save', async function(doc: any) {
  if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
    if (!doc.whatsappEnabled) {
      await Business.updateOne({ _id: doc._id }, { $set: { whatsappEnabled: true } });
      doc.whatsappEnabled = true;
    }
    
    try {
      const { inngest } = await import('../services/inngestService');
      await inngest.send({
        name: 'whatsapp/templates.provision',
        data: {
          subDomain: doc.subDomain,
          businessId: doc._id.toString(),
          language: 'es_PE',
        }
      });
      logger.info(`Queued template provisioning for business ${doc.subDomain}`);
    } catch (error: any) {
      logger.error(`Failed to queue template provisioning for ${doc.subDomain}:`, error);
      await Business.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            templateProvisioningError: error.message,
            templateProvisioningFailedAt: new Date()
          }
        }
      );
    }
  }
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

// Virtual getter for decrypted WhatsApp access token
BusinessSchema.virtual('decryptedWhatsAppAccessToken').get(function(this: any) {
  const encryptedToken = this.get('whatsappAccessToken');
  if (!encryptedToken) return null;
  try {
    return decrypt(encryptedToken);
  } catch (error) {
    return null;
  }
});

// Virtual getter for decrypted WhatsApp refresh token
BusinessSchema.virtual('decryptedWhatsAppRefreshToken').get(function(this: any) {
  const encryptedToken = this.get('whatsappRefreshToken');
  if (!encryptedToken) return null;
  try {
    return decrypt(encryptedToken);
  } catch (error) {
    return null;
  }
});

// Method to get decrypted WhatsApp access token
BusinessSchema.methods.getDecryptedWhatsAppAccessToken = function(this: any): string | null {
  const encryptedToken = this.get('whatsappAccessToken');
  if (!encryptedToken) return null;
  
  const tokenLength = encryptedToken.length;
  const isHexEncoded = /^[0-9a-fA-F]+$/.test(encryptedToken);
  const minEncryptedLength = 64;
  
  try {
    const decrypted = decrypt(encryptedToken);
    
    const isLikelyEncryptedValue = decrypted.length > 400 || /^[0-9a-fA-F]+$/.test(decrypted);
    if (isLikelyEncryptedValue) {
      logger.error(`Decrypted token for business ${this.subDomain || 'unknown'} appears to be encrypted value (length: ${decrypted.length}).`);
      return null;
    }
    
    return decrypted;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to decrypt WhatsApp access token for business ${this.subDomain || 'unknown'}: ${errorMessage}`);
    
    const isLikelyPlainText = tokenLength < minEncryptedLength || !isHexEncoded;
    
    if (isLikelyPlainText) {
      if (tokenLength <= 400 && !isHexEncoded) {
        logger.warn(`WhatsApp token for business ${this.subDomain || 'unknown'} appears to be stored in plain text.`);
        return encryptedToken;
      }
    }
    
    return null;
  }
};

// Method to get decrypted WhatsApp refresh token
BusinessSchema.methods.getDecryptedWhatsAppRefreshToken = function(this: any): string | null {
  const encryptedToken = this.get('whatsappRefreshToken');
  if (!encryptedToken) return null;
  try {
    return decrypt(encryptedToken);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to decrypt WhatsApp refresh token: ${errorMessage}`);
    
    const isLikelyPlainText = encryptedToken.length < 64 || !/^[0-9a-fA-F]+$/.test(encryptedToken);
    if (isLikelyPlainText) {
      logger.warn(`WhatsApp refresh token appears to be stored in plain text.`);
      return encryptedToken;
    }
    
    return null;
  }
};

/**
 * Check if a token is already encrypted
 */
const isEncrypted = (token: string): boolean => {
  if (!token) return false;
  try {
    decrypt(token);
    return true;
  } catch {
    return false;
  }
};

// Pre-save middleware to encrypt WhatsApp tokens
BusinessSchema.pre('save', async function (this: any, next: (err?: any) => void) {
  try {
    if (this.isModified('whatsappAccessToken') && this.whatsappAccessToken) {
      if (!isEncrypted(this.whatsappAccessToken)) {
        this.whatsappAccessToken = encrypt(this.whatsappAccessToken);
      }
    }
    
    if (this.isModified('whatsappRefreshToken') && this.whatsappRefreshToken) {
      if (!isEncrypted(this.whatsappRefreshToken)) {
        this.whatsappRefreshToken = encrypt(this.whatsappRefreshToken);
      }
    }
    
    next();
  } catch (err) {
    next(err as any);
  }
});

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);