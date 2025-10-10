import mongoose, { Schema, Document } from "mongoose";

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
  deliveryZones: any[];
  mileageZones: any[];
  settings: {
    allowDelivery: boolean;
    allowPickup: boolean;
    allowOnSite: boolean;
    deliveryHours: any;
    pickupHours: any;
    onSiteHours: any;
    kitchenCloseOffset: number;
  };
  businessId: string;
  subDomain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  deliveryZones: [{
    type: Schema.Types.Mixed,
    default: []
  }],
  mileageZones: [{
    type: Schema.Types.Mixed,
    default: []
  }],
  settings: {
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

// Pre-save middleware to generate localId if not provided
BusinessLocationSchema.pre('save', function(this: any, next: any) {
  if (!this.localId) {
    this.localId = `LOC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

export const BusinessLocation = mongoose.model<IBusinessLocation>('BusinessLocation', BusinessLocationSchema);