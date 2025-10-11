import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  taxId: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  active: boolean;
  subDomain: string;
  localId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  taxId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 50
  },
  localId: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    maxlength: 500
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: 200
  },
  active: {
    type: Boolean,
    default: true
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
CompanySchema.index({ name: 1 });
CompanySchema.index({ taxId: 1 });
CompanySchema.index({ active: 1 });
CompanySchema.index({ subDomain: 1 });
CompanySchema.index({ isActive: 1 });

// Compound index for unique company per subdomain
CompanySchema.index({ taxId: 1, subDomain: 1 }, { unique: true });

// Text search index for company search
CompanySchema.index({ 
  name: 'text', 
  contactPerson: 'text',
  address: 'text'
});

// Virtual relationship to get all drivers belonging to this company
CompanySchema.virtual('drivers', {
  ref: 'Driver',
  localField: '_id',
  foreignField: 'company'
});

// Ensure virtual fields are serialized
CompanySchema.set('toJSON', { virtuals: true });
CompanySchema.set('toObject', { virtuals: true });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
