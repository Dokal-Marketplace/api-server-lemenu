import mongoose, { Schema, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  subDomain: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
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
  permissions: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
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
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
RoleSchema.index({ name: 1 });
RoleSchema.index({ subDomain: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isDefault: 1 });
RoleSchema.index({ permissions: 1 });

// Compound index for unique role name per subdomain
RoleSchema.index({ name: 1, subDomain: 1 }, { unique: true });

// Text search index for role search
RoleSchema.index({ 
  name: 'text', 
  description: 'text'
});

// Static method to find roles by subdomain
RoleSchema.statics.findBySubdomain = function(subDomain: string) {
  return this.find({ subDomain, isActive: true }).sort({ name: 1 });
};

// Static method to find default roles
RoleSchema.statics.findDefaultRoles = function() {
  return this.find({ isDefault: true, isActive: true });
};

// Instance method to check if role has permission
RoleSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

// Instance method to add permission
RoleSchema.methods.addPermission = function(permission: string) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// Instance method to remove permission
RoleSchema.methods.removePermission = function(permission: string) {
  this.permissions = this.permissions.filter((p:any) => p !== permission);
  return this.save();
};

export const Role = mongoose.model<IRole>('Role', RoleSchema);
