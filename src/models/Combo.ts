import mongoose, { Schema, Document } from "mongoose";

export interface ICombo extends Document {
  name: string;
  description?: string;
  price: number;
  category: string;
  isActive: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    name: string;
  }>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ComboSchema = new Schema<ICombo>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
  category: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  items: [{
    productId: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    name: {
      type: String,
      required: true
    }
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
ComboSchema.index({ name: 1 });
ComboSchema.index({ category: 1 });
ComboSchema.index({ isActive: 1 });
ComboSchema.index({ price: 1 });
ComboSchema.index({ tags: 1 });

export const Combo = mongoose.model<ICombo>('Combo', ComboSchema);
