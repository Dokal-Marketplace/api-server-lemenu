import mongoose, { Schema, Document } from "mongoose";

export interface IPresentation extends Document {
  rId: string;
  productId: string;
  name: string;
  price: number;
  description?: string;
  isAvailableForDelivery: boolean;
  stock: number;
  imageUrl?: string;
  isPromotion?: boolean;
  servingSize?: number;
  amountWithDiscount: number;
  discountValue?: number;
  discountType?: number; // 0 = percentage, 1 = fixed amount
  subDomain: string;
  localId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PresentationSchema = new Schema<IPresentation>({
  rId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productId: {
    type: String,
    required: true,
    ref: 'Product',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isAvailableForDelivery: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
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
  isPromotion: {
    type: Boolean,
    default: false
  },
  servingSize: {
    type: Number,
    min: 0
  },
  amountWithDiscount: {
    type: Number,
    required: true,
    min: 0,
    default: function(this: IPresentation) {
      return this.price;
    }
  },
  discountValue: {
    type: Number,
    min: 0
  },
  discountType: {
    type: Number,
    enum: [0, 1], // 0 = percentage, 1 = fixed amount
    default: 0
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
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate amountWithDiscount
PresentationSchema.pre('save', function(next) {
  if (this.discountValue && this.discountType !== undefined) {
    if (this.discountType === 0) {
      // Percentage discount
      this.amountWithDiscount = this.price - (this.price * (this.discountValue / 100));
    } else if (this.discountType === 1) {
      // Fixed amount discount
      this.amountWithDiscount = this.price - this.discountValue;
    }
  } else {
    this.amountWithDiscount = this.price;
  }
  
  // Ensure amountWithDiscount is not negative
  this.amountWithDiscount = Math.max(0, this.amountWithDiscount);
  next();
});

// Indexes for better query performance
PresentationSchema.index({ productId: 1 });
PresentationSchema.index({ subDomain: 1 });
PresentationSchema.index({ localId: 1 });
PresentationSchema.index({ isActive: 1 });
PresentationSchema.index({ isAvailableForDelivery: 1 });
PresentationSchema.index({ isPromotion: 1 });
PresentationSchema.index({ price: 1 });
PresentationSchema.index({ stock: 1 });

// Text search index for presentation search
PresentationSchema.index({ 
  name: 'text', 
  description: 'text'
});

export const Presentation = mongoose.model<IPresentation>('Presentation', PresentationSchema);
