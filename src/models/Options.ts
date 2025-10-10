import mongoose, { Schema, Document } from "mongoose";

export interface IOption extends Document {
  rId: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  isActive: boolean;
  category?: string;
  modifierId?: string;
  subDomain: string;
  localId: string;
  imageUrl?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  allergens?: string[];
  tags?: string[];
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionsSchema = new Schema<IOption>({
  rId: {
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
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    min: 0,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  modifierId: {
    type: String,
    ref: 'Modifier',
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
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid URL'
    }
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    sugar: {
      type: Number,
      min: 0
    }
  },
  allergens: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
OptionsSchema.index({ subDomain: 1 });
OptionsSchema.index({ localId: 1 });
OptionsSchema.index({ subDomain: 1, localId: 1 });
OptionsSchema.index({ isActive: 1 });
OptionsSchema.index({ category: 1 });
OptionsSchema.index({ modifierId: 1 });
OptionsSchema.index({ price: 1 });
OptionsSchema.index({ sortOrder: 1 });

// Compound indexes
OptionsSchema.index({ subDomain: 1, isActive: 1 });
OptionsSchema.index({ localId: 1, isActive: 1 });
OptionsSchema.index({ subDomain: 1, category: 1 });
OptionsSchema.index({ modifierId: 1, isActive: 1 });

// Text search index
OptionsSchema.index({ 
  name: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
});

// Static methods
OptionsSchema.statics.findByCategory = function(category: string, subDomain?: string, localId?: string) {
  const query: any = { category };
  if (subDomain) query.subDomain = subDomain;
  if (localId) query.localId = localId;
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

OptionsSchema.statics.findByModifier = function(modifierId: string) {
  return this.find({ modifierId }).sort({ sortOrder: 1, name: 1 });
};

OptionsSchema.statics.findActive = function(subDomain?: string, localId?: string) {
  const query: any = { isActive: true };
  if (subDomain) query.subDomain = subDomain;
  if (localId) query.localId = localId;
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

// Instance methods
OptionsSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  return this.save();
};

OptionsSchema.methods.updateStock = function(newStock: number) {
  this.stock = newStock;
  return this.save();
};

// Pre-save middleware to generate rId if not provided
OptionsSchema.pre('save', function(this: any, next: any) {
  if (!this.rId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.rId = `OPT${timestamp}${random}`;
  }
  next();
});

export const Options = mongoose.model<IOption>('Options', OptionsSchema);
