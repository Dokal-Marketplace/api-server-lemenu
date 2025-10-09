import mongoose, { Schema, Document } from "mongoose";

export interface IIntegration extends Document {
  userId: string; // Reference to User
  businessId: string; // Reference to Business
  subDomain: string; // Subdomain for the integration
  name: string; // Business name for quick reference
  isActive: boolean;
  isPrimary: boolean; // Primary business for the user
  role: string; // User's role in this business
  permissions: string[]; // Specific permissions for this business
  integrationStatus: 'pending' | 'active' | 'suspended' | 'completed';
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    trim: true
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
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPrimary: {
    type: Boolean,
    default: false
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
  integrationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'suspended', 'completed'],
    default: 'pending'
  },
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
IntegrationSchema.index({ userId: 1 });
IntegrationSchema.index({ businessId: 1 });
IntegrationSchema.index({ isActive: 1 });
IntegrationSchema.index({ isPrimary: 1 });
IntegrationSchema.index({ integrationStatus: 1 });
IntegrationSchema.index({ lastAccessed: 1 });

// Compound indexes
IntegrationSchema.index({ userId: 1, isActive: 1 });
IntegrationSchema.index({ userId: 1, isPrimary: 1 });
IntegrationSchema.index({ businessId: 1, isActive: 1 });
IntegrationSchema.index({ subDomain: 1, isActive: 1 });

// Unique constraint: one integration per user-business combination
IntegrationSchema.index({ userId: 1, businessId: 1 }, { unique: true });
// Unique constraint: one integration per subdomain
IntegrationSchema.index({ subDomain: 1 }, { unique: true });

// Static method to find user's integrations
IntegrationSchema.statics.findByUserId = function(userId: string, activeOnly: boolean = true) {
  const query: any = { userId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ isPrimary: -1, createdAt: -1 });
};

// Static method to find integration by businessId
IntegrationSchema.statics.findByBusinessId = function(businessId: string, activeOnly: boolean = true) {
  const query: any = { businessId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find integration by subdomain
IntegrationSchema.statics.findBySubdomain = function(subDomain: string, activeOnly: boolean = true) {
  const query: any = { subDomain };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.findOne(query);
};

// Static method to find user's primary integration
IntegrationSchema.statics.findPrimaryByUserId = function(userId: string) {
  return this.findOne({ userId, isPrimary: true, isActive: true });
};

// Static method to set primary integration
IntegrationSchema.statics.setPrimaryIntegration = async function(userId: string, integrationId: string) {
  // Remove primary flag from all user's integrations
  await this.updateMany({ userId }, { isPrimary: false });
  
  // Set new primary integration
  return this.findByIdAndUpdate(integrationId, { isPrimary: true }, { new: true });
};

// Instance method to update last accessed
IntegrationSchema.methods.updateLastAccessed = function() {
  this.lastAccessed = new Date();
  return this.save();
};

// Instance method to check if user has permission
IntegrationSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

// Instance method to add permission
IntegrationSchema.methods.addPermission = function(permission: string) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// Instance method to remove permission
IntegrationSchema.methods.removePermission = function(permission: string) {
  this.permissions = this.permissions.filter((p: string) => p !== permission);
  return this.save();
};

// Instance method to update integration status
IntegrationSchema.methods.updateIntegrationStatus = function(status: 'pending' | 'active' | 'suspended' | 'completed') {
  this.integrationStatus = status;
  return this.save();
};

// Virtual for integration display name
IntegrationSchema.virtual('displayName').get(function(this: IIntegration) {
  return this.name;
});

// Virtual for integration status
IntegrationSchema.virtual('status').get(function(this: IIntegration) {
  return this.isActive ? 'Active' : 'Inactive';
});

// Virtual for integration progress
IntegrationSchema.virtual('integrationProgress').get(function(this: IIntegration) {
  const statusMap: Record<string, number> = {
    'pending': 0,
    'active': 50,
    'suspended': 25,
    'completed': 100
  };
  return statusMap[this.integrationStatus] || 0;
});

// Ensure virtual fields are serialized
IntegrationSchema.set('toJSON', { virtuals: true });
IntegrationSchema.set('toObject', { virtuals: true });

export const Integration = mongoose.model<IIntegration>('Integration', IntegrationSchema);
