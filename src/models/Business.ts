import mongoose, { Schema, Document } from "mongoose";
import { encrypt, decrypt } from "../utils/encryption";
import logger from "../utils/logger";

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
  // WhatsApp Business API tokens (encrypted)
  whatsappAccessToken?: string; // Encrypted Meta WhatsApp Business API access token
  whatsappTokenExpiresAt?: Date; // Token expiration date
  whatsappRefreshToken?: string; // Encrypted refresh token (if applicable)
  
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
  // WhatsApp activation flag - when true, WhatsApp is required for active businesses
  whatsappEnabled?: boolean;
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

// Pre-save validation: WhatsApp is required only when WhatsApp is being enabled
// This prevents blocking saves for businesses that haven't linked WhatsApp yet
BusinessSchema.pre('save', function(next) {
  // Only validate if WhatsApp is being enabled (whatsappEnabled is being set to true)
  const isEnablingWhatsApp = this.isModified('whatsappEnabled') && this.whatsappEnabled === true;
  
  // Also validate if WhatsApp is already enabled AND we're modifying WhatsApp configuration fields
  const isModifyingWhatsAppConfig = this.whatsappEnabled === true && (
    this.isModified('wabaId') || 
    this.isModified('whatsappPhoneNumberIds') || 
    this.isModified('whatsappAccessToken')
  );
  
  // Only validate when enabling WhatsApp or modifying WhatsApp config for enabled businesses
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
  // Only trigger if WABA is set, templates not yet provisioned, and this is a new WABA link
  // Also enable WhatsApp when credentials are first set
  if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
    // Enable WhatsApp if not already enabled
    if (!doc.whatsappEnabled) {
      await Business.updateOne({ _id: doc._id }, { $set: { whatsappEnabled: true } });
      doc.whatsappEnabled = true;
    }
    
    try {
      // Use Inngest for background processing
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
      // Mark for manual retry
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
  
  // Diagnostic information about the token format
  const tokenLength = encryptedToken.length;
  const isHexEncoded = /^[0-9a-fA-F]+$/.test(encryptedToken);
  const minEncryptedLength = 64; // IV (32) + TAG (32) minimum
  
  try {
    const decrypted = decrypt(encryptedToken);
    
    // Validate that the decrypted result looks like a valid Facebook access token
    // Facebook tokens are typically 200-300 chars, contain alphanumeric and special chars
    // If result is very long (>400 chars) or looks like hex-only, decryption likely failed
    const isLikelyEncryptedValue = decrypted.length > 400 || /^[0-9a-fA-F]+$/.test(decrypted);
    if (isLikelyEncryptedValue) {
      logger.error(`Decrypted token for business ${this.subDomain || 'unknown'} appears to be encrypted value (length: ${decrypted.length}). Decryption may have returned corrupted data.`, {
        decryptedLength: decrypted.length,
        isHexOnly: /^[0-9a-fA-F]+$/.test(decrypted),
        originalTokenLength: tokenLength
      });
      return null;
    }
    
    return decrypted;
  } catch (error) {
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to decrypt WhatsApp access token for business ${this.subDomain || 'unknown'}: ${errorMessage}`, {
      tokenLength,
      isHexEncoded,
      minEncryptedLength,
      meetsMinLength: tokenLength >= minEncryptedLength,
      tokenPreview: encryptedToken.substring(0, 50) + (tokenLength > 50 ? '...' : ''),
      errorName: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Check if token might be stored in plain text (not encrypted)
    // Encrypted tokens should be at least 64 hex chars (32 for IV + 32 for tag) + encrypted data
    // If token is shorter or doesn't look like hex, it might be plain text
    const isLikelyPlainText = tokenLength < minEncryptedLength || !isHexEncoded;
    
    if (isLikelyPlainText) {
      // Validate plain text token looks reasonable (not too long, contains non-hex chars)
      if (tokenLength <= 400 && !isHexEncoded) {
        logger.warn(`WhatsApp token for business ${this.subDomain || 'unknown'} appears to be stored in plain text. It should be encrypted.`, {
          tokenLength,
          tokenPreview: encryptedToken.substring(0, 30) + '...'
        });
        return encryptedToken;
      } else {
        logger.error(`WhatsApp token for business ${this.subDomain || 'unknown'} appears to be in invalid format.`, {
          tokenLength,
          isHexEncoded,
          expectedFormat: 'Hex-encoded string with IV (32 chars) + TAG (32 chars) + encrypted data',
          actualFormat: isHexEncoded ? 'Hex-encoded but may be corrupted' : 'Not hex-encoded (may be plain text or different format)',
          tokenPreview: encryptedToken.substring(0, 50) + '...'
        });
        return null;
      }
    }
    
    // Token looks encrypted but decryption failed - likely encryption key mismatch or corrupted data
    logger.error(`Token decryption failed for business ${this.subDomain || 'unknown'}. Token format appears correct but decryption failed.`, {
      tokenLength,
      isHexEncoded,
      possibleCauses: [
        'Encryption key mismatch (ENCRYPTION_KEY environment variable changed)',
        'Token was encrypted with a different key',
        'Token data is corrupted',
        'Token was encrypted with a different encryption method'
      ]
    });
    
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
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to decrypt WhatsApp refresh token for business ${this.subDomain || 'unknown'}: ${errorMessage}`);
    
    // Check if token might be stored in plain text (not encrypted)
    const isLikelyPlainText = encryptedToken.length < 64 || !/^[0-9a-fA-F]+$/.test(encryptedToken);
    
    if (isLikelyPlainText) {
      logger.warn(`WhatsApp refresh token for business ${this.subDomain || 'unknown'} appears to be stored in plain text. It should be encrypted.`);
      // For backward compatibility, return the token as-is if it looks like plain text
      return encryptedToken;
    }
    
    return null;
  }
};

/**
 * Check if a token is already encrypted by attempting to decrypt it
 * If decryption succeeds, it's already encrypted; if it fails, it needs encryption
 */
const isEncrypted = (token: string): boolean => {
  if (!token) return false;
  try {
    decrypt(token);
    return true; // Decryption succeeded, token is already encrypted
  } catch {
    return false; // Decryption failed, token is not encrypted
  }
};

// Pre-save middleware to encrypt WhatsApp tokens
BusinessSchema.pre('save', async function (this: any, next: (err?: any) => void) {
  try {
    // Encrypt WhatsApp access token if it's modified and not already encrypted
    if (this.isModified('whatsappAccessToken') && this.whatsappAccessToken) {
      if (!isEncrypted(this.whatsappAccessToken)) {
        this.whatsappAccessToken = encrypt(this.whatsappAccessToken);
      }
    }
    
    // Encrypt WhatsApp refresh token if it's modified and not already encrypted
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