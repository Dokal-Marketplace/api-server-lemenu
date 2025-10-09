import mongoose, { Schema, Document } from "mongoose";

export interface IModifierOption {
  optionId: string;
  name: string;
  price: number;
  stock?: number;
  isActive?: boolean;
}

export interface IModifier extends Document {
  rId: string;
  name: string;
  isMultiple: boolean;
  minQuantity: number;
  maxQuantity: number;
  options: IModifierOption[];
  localsId: string[];
  subDomain: string;
  source: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModifierOptionSchema = new Schema<IModifierOption>({
  optionId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
  }
}, { _id: false });

const ModifierSchema = new Schema<IModifier>({
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
  isMultiple: {
    type: Boolean,
    default: false
  },
  minQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  maxQuantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
    validate: {
      validator: function(this: IModifier, v: number) {
        return v >= this.minQuantity;
      },
      message: 'Max quantity must be greater than or equal to min quantity'
    }
  },
  options: [ModifierOptionSchema],
  localsId: [{
    type: String,
    required: true,
    trim: true
  }],
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  source: {
    type: String,
    required: true,
    trim: true,
    default: "0"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ModifierSchema.index({ subDomain: 1 });
ModifierSchema.index({ localsId: 1 });
ModifierSchema.index({ isActive: 1 });
ModifierSchema.index({ name: 1 });
ModifierSchema.index({ isMultiple: 1 });
ModifierSchema.index({ 'options.optionId': 1 });
ModifierSchema.index({ 'options.isActive': 1 });

// Text search index for modifier search
ModifierSchema.index({ 
  name: 'text',
  'options.name': 'text'
});

export const Modifier = mongoose.model<IModifier>('Modifier', ModifierSchema);
