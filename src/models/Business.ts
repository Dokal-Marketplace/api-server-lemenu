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
  subdominio: string;
  linkDominio: string;
  localId: string;
  localNombreComercial: string;
  localDescripcion?: string;
  localDireccion?: string;
  localDepartamento?: string;
  localProvincia?: string;
  localDistrito?: string;
  localTelefono: string;
  localWpp: string;
  phoneCountryCode: string;
  wppCountryCode: string;
  localAceptaDelivery: boolean;
  localAceptaRecojo: boolean;
  localAceptaPagoEnLinea: boolean;
  localSoloPagoEnLinea: boolean;
  localPorcentajeImpuesto: number;
  estaAbiertoParaDelivery: boolean;
  estaAbiertoParaRecojo: boolean;
  userId: string; // Reference to User who created the business
  isActive: boolean;
  // New fields from types
  name: string;
  description?: string;
  subDomain: string;
  logo?: string;
  coverImage?: string;
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
  status: 'active' | 'inactive' | 'suspended';
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
    enum: ['PEN', 'USD', 'EUR'],
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
  subdominio: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  linkDominio: {
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
  localId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  localNombreComercial: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  localDescripcion: {
    type: String,
    trim: true,
    maxlength: 255
  },
  localDireccion: {
    type: String,
    required: false,
    trim: true,
    maxlength: 255
  },
  localDepartamento: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localProvincia: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localDistrito: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localTelefono: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    match: [/^[\+]?[0-9\s\-\(\)]{7,20}$/, 'Please enter a valid phone number']
  },
  localWpp: {
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
  wppCountryCode: {
    type: String,
    required: true,
    trim: true,
    default: '+51',
    match: [/^\+[0-9]{1,4}$/, 'Invalid country code format']
  },
  localAceptaDelivery: {
    type: Boolean,
    default: true
  },
  localAceptaRecojo: {
    type: Boolean,
    default: true
  },
  localAceptaPagoEnLinea: {
    type: Boolean,
    default: true
  },
  localSoloPagoEnLinea: {
    type: Boolean,
    default: false
  },
  localPorcentajeImpuesto: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 18
  },
  estaAbiertoParaDelivery: {
    type: Boolean,
    default: true
  },
  estaAbiertoParaRecojo: {
    type: Boolean,
    default: true
  },
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
  // New fields from types
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
  status: {
    type: String,
    required: false,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
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
BusinessSchema.index({ localDepartamento: 1, localProvincia: 1, localDistrito: 1 });
BusinessSchema.index({ localAceptaDelivery: 1 });
BusinessSchema.index({ localAceptaRecojo: 1 });
BusinessSchema.index({ localAceptaPagoEnLinea: 1 });
BusinessSchema.index({ estaAbiertoParaDelivery: 1 });
BusinessSchema.index({ estaAbiertoParaRecojo: 1 });
BusinessSchema.index({ 'owner.userId': 1 });
BusinessSchema.index({ 'settings.currency': 1 });
BusinessSchema.index({ 'address.city': 1 });
BusinessSchema.index({ 'address.state': 1 });
BusinessSchema.index({ 'address.country': 1 });

// Text search index for business search
BusinessSchema.index({ 
  localNombreComercial: 'text', 
  localDescripcion: 'text',
  localDireccion: 'text',
  name: 'text',
  description: 'text',
  'address.street': 'text',
  'address.city': 'text'
});

// Pre-save middleware to generate localId if not provided
BusinessSchema.pre('save', function(this: any, next: any) {
  if (!this.localId) {
    this.localId = `LOC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Virtual for full phone number
BusinessSchema.virtual('fullPhoneNumber').get(function(this: any) {
  return `${this.phoneCountryCode} ${this.localTelefono}`;
});

// Virtual for full WhatsApp number
BusinessSchema.virtual('fullWhatsAppNumber').get(function(this: any) {
  return `${this.wppCountryCode} ${this.localWpp}`;
});

// Virtual for full address
BusinessSchema.virtual('fullAddress').get(function(this: any) {
  return `${this.localDireccion}, ${this.localDistrito}, ${this.localProvincia}, ${this.localDepartamento}`;
});

// Ensure virtual fields are serialized
BusinessSchema.set('toJSON', { virtuals: true });
BusinessSchema.set('toObject', { virtuals: true });

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);
