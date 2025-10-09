import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessLocationSettings {
  allowDelivery: boolean;
  allowPickup: boolean;
  allowOnSite: boolean;
  deliveryHours: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  pickupHours: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  onSiteHours: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  kitchenCloseOffset: number; // minutes before closing
}

export interface IDeliveryZone {
  id: string;
  name: string;
  description?: string;
  type: 'polygon' | 'circle';
  coordinates: number[][];
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // km for circle zones
  deliveryFee: number;
  minOrderValue: number;
  estimatedDeliveryTime: number; // minutes
  isActive: boolean;
  restrictions?: {
    maxWeight: number;
    allowedVehicles: ('motorcycle' | 'bicycle' | 'car' | 'van' | 'truck')[];
    timeSlots: Array<{
      start: string;
      end: string;
    }>;
  };
}

export interface IMileageZone {
  id: string;
  name: string;
  description?: string;
  type: 'mileage';
  baseDistance: number; // km
  baseCost: number;
  incrementPerKm: number;
  costIncrement: number;
  center: {
    latitude: number;
    longitude: number;
  };
  workingHours: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  minOrderValue: number;
  estimatedDeliveryTime: number; // minutes
  isActive: boolean;
}

export interface IBusinessLocation extends Document {
  localId: string;
  name: string;
  description?: string;
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
  phone: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  schedule: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  deliveryZones: IDeliveryZone[];
  mileageZones: IMileageZone[];
  settings: IBusinessLocationSettings;
  businessId: string; // Reference to Business
  subDomain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// BusinessLocationSettings Schema
const BusinessLocationSettingsSchema = new Schema<IBusinessLocationSettings>({
  allowDelivery: {
    type: Boolean,
    default: true
  },
  allowPickup: {
    type: Boolean,
    default: true
  },
  allowOnSite: {
    type: Boolean,
    default: false
  },
  deliveryHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  pickupHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  onSiteHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  kitchenCloseOffset: {
    type: Number,
    required: true,
    min: 0,
    default: 30
  }
}, { _id: false });

// DeliveryZone Schema
const DeliveryZoneSchema = new Schema<IDeliveryZone>({
  id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['polygon', 'circle']
  },
  coordinates: [[{
    type: Number,
    required: true
  }]],
  center: {
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
  },
  radius: {
    type: Number,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderValue: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  restrictions: {
    maxWeight: {
      type: Number,
      min: 0
    },
    allowedVehicles: [{
      type: String,
      enum: ['motorcycle', 'bicycle', 'car', 'van', 'truck']
    }],
    timeSlots: [{
      start: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
      },
      end: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
      }
    }]
  }
}, { _id: false });

// MileageZone Schema
const MileageZoneSchema = new Schema<IMileageZone>({
  id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['mileage'],
    default: 'mileage'
  },
  baseDistance: {
    type: Number,
    required: true,
    min: 0
  },
  baseCost: {
    type: Number,
    required: true,
    min: 0
  },
  incrementPerKm: {
    type: Number,
    required: true,
    min: 0
  },
  costIncrement: {
    type: Number,
    required: true,
    min: 0
  },
  center: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  workingHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  minOrderValue: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const BusinessLocationSchema = new Schema<IBusinessLocation>({
  localId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
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
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      required: true,
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
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  schedule: {
    type: Schema.Types.Mixed,
    default: {}
  },
  deliveryZones: [DeliveryZoneSchema],
  mileageZones: [MileageZoneSchema],
  settings: {
    type: BusinessLocationSettingsSchema,
    required: true,
    default: {}
  },
  businessId: {
    type: String,
    required: true,
    ref: 'Business',
    trim: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BusinessLocationSchema.index({ businessId: 1 });
BusinessLocationSchema.index({ subDomain: 1 });
BusinessLocationSchema.index({ status: 1 });
BusinessLocationSchema.index({ isActive: 1 });
BusinessLocationSchema.index({ 'address.city': 1 });
BusinessLocationSchema.index({ 'address.state': 1 });
BusinessLocationSchema.index({ 'address.country': 1 });
BusinessLocationSchema.index({ 'deliveryZones.isActive': 1 });
BusinessLocationSchema.index({ 'mileageZones.isActive': 1 });
BusinessLocationSchema.index({ 'settings.allowDelivery': 1 });
BusinessLocationSchema.index({ 'settings.allowPickup': 1 });
BusinessLocationSchema.index({ 'settings.allowOnSite': 1 });

// Geospatial indexes for location-based queries
BusinessLocationSchema.index({ 'address.coordinates': '2dsphere' });
BusinessLocationSchema.index({ 'deliveryZones.center': '2dsphere' });
BusinessLocationSchema.index({ 'mileageZones.center': '2dsphere' });

// Text search index for location search
BusinessLocationSchema.index({ 
  name: 'text',
  description: 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text'
});

// Pre-save middleware to generate localId if not provided
BusinessLocationSchema.pre('save', function(this: any, next: any) {
  if (!this.localId) {
    this.localId = `LOC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Validation for delivery zones
BusinessLocationSchema.pre('save', function(this: any, next: any) {
  // Validate polygon zones have at least 3 points
  this.deliveryZones.forEach((zone: any) => {
    if (zone.type === 'polygon' && (!zone.coordinates || zone.coordinates.length < 3)) {
      return next(new Error('Polygon zones must have at least 3 coordinates'));
    }
    if (zone.type === 'circle' && (!zone.center || !zone.radius)) {
      return next(new Error('Circle zones must have center coordinates and radius'));
    }
  });
  next();
});

// Static methods
BusinessLocationSchema.statics.findByBusiness = function(businessId: string, activeOnly: boolean = true) {
  const query: any = { businessId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

BusinessLocationSchema.statics.findBySubDomain = function(subDomain: string, activeOnly: boolean = true) {
  const query: any = { subDomain };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

BusinessLocationSchema.statics.findNearby = function(latitude: number, longitude: number, maxDistance: number = 10000) {
  return this.find({
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

// Instance methods
BusinessLocationSchema.methods.addDeliveryZone = function(zone: IDeliveryZone) {
  this.deliveryZones.push(zone);
  return this.save();
};

BusinessLocationSchema.methods.addMileageZone = function(zone: IMileageZone) {
  this.mileageZones.push(zone);
  return this.save();
};

BusinessLocationSchema.methods.removeDeliveryZone = function(zoneId: string) {
  this.deliveryZones = this.deliveryZones.filter((zone: any) => zone.id !== zoneId);
  return this.save();
};

BusinessLocationSchema.methods.removeMileageZone = function(zoneId: string) {
  this.mileageZones = this.mileageZones.filter((zone: any) => zone.id !== zoneId);
  return this.save();
};

BusinessLocationSchema.methods.updateStatus = function(newStatus: string) {
  this.status = newStatus as any;
  return this.save();
};

// Virtual for full address
BusinessLocationSchema.virtual('fullAddress').get(function(this: any) {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for active delivery zones count
BusinessLocationSchema.virtual('activeDeliveryZonesCount').get(function(this: any) {
  return this.deliveryZones.filter((zone: any) => zone.isActive).length;
});

// Virtual for active mileage zones count
BusinessLocationSchema.virtual('activeMileageZonesCount').get(function(this: any) {
  return this.mileageZones.filter((zone: any) => zone.isActive).length;
});

// Ensure virtual fields are serialized
BusinessLocationSchema.set('toJSON', { virtuals: true });
BusinessLocationSchema.set('toObject', { virtuals: true });

export const BusinessLocation = mongoose.model<IBusinessLocation>('BusinessLocation', BusinessLocationSchema);
