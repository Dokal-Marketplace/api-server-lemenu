import mongoose, { Schema, Document, Types, CallbackError } from "mongoose";

export interface IVehicleInfo {
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

export interface IDriverAvailability {
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

export interface IDriverStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number; // minutes
  totalEarnings: number;
  monthlyEarnings: number;
}

export interface IDriver extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licensePlate: string;
  vehicleModel: string;
  company?: Types.ObjectId; // Reference to Company model
  active: boolean;
  available: boolean;
  subDomain: string;
  localId: string;
  isActive: boolean;
  // New fields from types
  name: string;
  dni: string;
  licenseNumber: string;
  licenseType: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'van' | 'truck';
  vehicleInfo: IVehicleInfo;
  status: 'active' | 'inactive' | 'suspended' | 'on_delivery' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdate: Date;
  };
  availability: IDriverAvailability;
  ratings: {
    average: number;
    totalRatings: number;
  };
  stats: IDriverStats;
  createdAt: Date;
  updatedAt: Date;
}

// VehicleInfo Schema
const VehicleInfoSchema = new Schema<IVehicleInfo>({
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  insurance: {
    company: {
      type: String,
      trim: true,
      maxlength: 100
    },
    policyNumber: {
      type: String,
      trim: true,
      maxlength: 50
    },
    expiryDate: {
      type: String,
      trim: true
    }
  }
}, { _id: false });

// DriverAvailability Schema
const DriverAvailabilitySchema = new Schema<IDriverAvailability>({
  isAvailable: {
    type: Boolean,
    default: true
  },
  workingHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  maxOrdersPerHour: {
    type: Number,
    required: true,
    min: 1,
    default: 5
  },
  currentOrders: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: false });

// DriverStats Schema
const DriverStatsSchema = new Schema<IDriverStats>({
  totalDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  successfulDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  cancelledDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  averageDeliveryTime: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyEarnings: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const DriverSchema = new Schema<IDriver>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  vehicleModel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  available: {
    type: Boolean,
    default: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    required: true,
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
  dni: {
    type: String,
    required: false,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  licenseType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['motorcycle', 'bicycle', 'car', 'van', 'truck']
  },
  vehicleInfo: {
    type: VehicleInfoSchema,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended', 'on_delivery', 'offline'],
    default: 'active'
  },
  currentLocation: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  availability: {
    type: DriverAvailabilitySchema,
    required: true,
    default: {}
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  stats: {
    type: DriverStatsSchema,
    required: true,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
DriverSchema.index({ firstName: 1, lastName: 1 });
DriverSchema.index({ name: 1 });
DriverSchema.index({ email: 1 });
DriverSchema.index({ phone: 1 });
DriverSchema.index({ dni: 1 });
DriverSchema.index({ licensePlate: 1 });
DriverSchema.index({ licenseNumber: 1 });
DriverSchema.index({ company: 1 });
DriverSchema.index({ active: 1 });
DriverSchema.index({ available: 1 });
DriverSchema.index({ status: 1 });
DriverSchema.index({ subDomain: 1 });
DriverSchema.index({ localId: 1 });
DriverSchema.index({ isActive: 1 });
DriverSchema.index({ vehicleType: 1 });
DriverSchema.index({ 'availability.isAvailable': 1 });
DriverSchema.index({ 'ratings.average': 1 });
DriverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

// Compound index for unique driver per subdomain
DriverSchema.index({ email: 1, subDomain: 1 }, { unique: true });
DriverSchema.index({ licensePlate: 1, subDomain: 1 }, { unique: true });
DriverSchema.index({ dni: 1, subDomain: 1 }, { unique: true });
DriverSchema.index({ licenseNumber: 1, subDomain: 1 }, { unique: true });

// Text search index for driver search
DriverSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  name: 'text',
  email: 'text',
  vehicleModel: 'text',
  'vehicleInfo.brand': 'text',
  'vehicleInfo.model': 'text'
});

// Pre-save validation for company reference
DriverSchema.pre('save', async function(next) {
  if (this.company) {
    try {
      const { Company } = await import('./Company');
      const company = await Company.findById(this.company);
      if (!company) {
        return next(new Error('Referenced company does not exist'));
      }
      if (company.subDomain !== this.subDomain) {
        return next(new Error('Company must belong to the same subdomain'));
      }
    } catch (error) {
      return next(error as CallbackError);
    }
  }
  next();
});

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
