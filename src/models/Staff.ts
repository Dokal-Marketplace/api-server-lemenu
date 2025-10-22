import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAssignedLocal {
  localId: string;
  localName: string;
  subDomain: string;
  role: string;
  permissions: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface IStaffPermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
  scope: 'own' | 'local' | 'all';
}

export interface ISalaryInfo {
  type: 'hourly' | 'monthly' | 'commission';
  amount: number;
  currency: string;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  bonuses?: Array<{
    type: string;
    amount: number;
    conditions: string;
  }>;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface IStaffDocument {
  type: 'id' | 'contract' | 'medical' | 'certification' | 'other';
  name: string;
  url: string;
  uploadDate: Date;
  expiryDate?: Date;
}

export interface IPerformanceGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: 'active' | 'completed' | 'overdue';
}

export interface IStaffPerformance {
  rating: number; // 1-5
  totalRatings: number;
  punctualityScore: number;
  productivityScore: number;
  customerServiceScore: number;
  lastReviewDate?: Date;
  goals: IPerformanceGoal[];
}

export interface IStaff extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Types.ObjectId; // Reference to Role model
  subDomain: string;
  isActive: boolean;
  lastLogin?: Date;
  // New fields from types
  dni?: string;
  assignedLocals: IAssignedLocal[];
  permissions: IStaffPermission[];
  workingHours: {
    [day: string]: Array<{
      start: string;
      end: string;
    }> | null;
  };
  salary?: ISalaryInfo;
  emergencyContact?: IEmergencyContact;
  documents: IStaffDocument[];
  performance: IStaffPerformance;
  user?: Types.ObjectId; // Reference to auth user
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// AssignedLocal Schema
const AssignedLocalSchema = new Schema({
  localId: {
    type: String,
    required: true,
    ref: 'Local',
    trim: true
  },
  localName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  permissions: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// StaffPermission Schema
const StaffPermissionSchema = new Schema({
  resource: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  actions: [{
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  }],
  scope: {
    type: String,
    required: true,
    enum: ['own', 'local', 'all']
  }
}, { _id: false });

// SalaryInfo Schema
const SalaryInfoSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['hourly', 'monthly', 'commission']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3,
    default: 'PEN'
  },
  paymentFrequency: {
    type: String,
    required: true,
    enum: ['weekly', 'biweekly', 'monthly']
  },
  bonuses: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    conditions: {
      type: String,
      required: true,
      trim: true
    }
  }]
}, { _id: false });

// EmergencyContact Schema
const EmergencyContactSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
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
  }
}, { _id: false });

// StaffDocument Schema
const StaffDocumentSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['id', 'contract', 'medical', 'certification', 'other']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  url: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Document URL must be a valid URL'
    }
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
}, { _id: false });

// PerformanceGoal Schema
const PerformanceGoalSchema = new Schema({
  id: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  target: {
    type: Number,
    required: true,
    min: 0
  },
  current: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'overdue'],
    default: 'active'
  }
}, { _id: false });

// StaffPerformance Schema
const StaffPerformanceSchema = new Schema({
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  punctualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  productivityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  customerServiceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  lastReviewDate: {
    type: Date
  },
  goals: [PerformanceGoalSchema]
}, { _id: false });

const StaffSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Role'
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
  },
  lastLogin: {
    type: Date
  },
  // New fields from types
  dni: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  assignedLocals: [AssignedLocalSchema],
  permissions: [StaffPermissionSchema],
  workingHours: {
    type: Schema.Types.Mixed,
    default: {}
  },
  salary: SalaryInfoSchema,
  emergencyContact: EmergencyContactSchema,
  documents: [StaffDocumentSchema],
  performance: {
    type: StaffPerformanceSchema,
    required: false,
    default: {
      rating: 0,
      totalRatings: 0,
      punctualityScore: 0,
      productivityScore: 0,
      customerServiceScore: 0
    }
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

// Indexes for better query performance
StaffSchema.index({ subDomain: 1 });
StaffSchema.index({ role: 1 });
StaffSchema.index({ isActive: 1 });
StaffSchema.index({ lastLogin: 1 });
StaffSchema.index({ dni: 1 });
StaffSchema.index({ user: 1 });
StaffSchema.index({ 'assignedLocals.localId': 1 });
StaffSchema.index({ 'assignedLocals.isActive': 1 });
StaffSchema.index({ 'performance.rating': 1 });
StaffSchema.index({ 'salary.type': 1 });
StaffSchema.index({ 'documents.type': 1 });

// Compound index for unique email per subdomain
StaffSchema.index({ email: 1, subDomain: 1 }, { unique: true });

// Text search index for staff search
StaffSchema.index({ 
  name: 'text', 
  email: 'text',
  dni: 'text',
  'assignedLocals.localName': 'text'
});

// Pre-save middleware to hash password
StaffSchema.pre('save', async function(this: any, next: any) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
StaffSchema.methods.comparePassword = async function(this: any, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Instance method to update last login
StaffSchema.methods.updateLastLogin = function(this: any) {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find staff by email and subdomain
StaffSchema.statics.findByEmailAndSubdomain = function(email: string, subDomain: string) {
  return this.findOne({ email, subDomain, isActive: true }).select('+password');
};

// Static method to find active staff by subdomain
StaffSchema.statics.findActiveBySubdomain = function(subDomain: string) {
  return this.find({ subDomain, isActive: true }).select('-password');
};

// Virtual for staff display name
StaffSchema.virtual('displayName').get(function(this: any) {
  return this.name;
});

// Virtual for staff status
StaffSchema.virtual('status').get(function(this: any) {
  return this.isActive ? 'Active' : 'Inactive';
});

// Ensure virtual fields are serialized
StaffSchema.set('toJSON', { 
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret.password;
    return ret;
  }
});

StaffSchema.set('toObject', { 
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    delete ret.password;
    return ret;
  }
});

export const Staff = mongoose.model('Staff', StaffSchema);
