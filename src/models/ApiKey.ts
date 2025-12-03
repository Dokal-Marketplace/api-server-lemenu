import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface IApiKey extends Document {
  name: string;
  key: string;
  keyPrefix: string;
  hashedKey: string;
  userId: mongoose.Types.ObjectId;
  businessId?: string;
  subDomain?: string;
  scopes: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  ipWhitelist?: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  compareKey(plainKey: string): Promise<boolean>;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      description: 'Human-readable name for the API key'
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
      description: 'First 8 characters of the key for identification'
    },
    hashedKey: {
      type: String,
      required: true,
      description: 'Bcrypt hashed full API key'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      description: 'User who owns this API key'
    },
    businessId: {
      type: String,
      index: true,
      description: 'Associated business ID'
    },
    subDomain: {
      type: String,
      index: true,
      description: 'Associated business subdomain'
    },
    scopes: {
      type: [String],
      required: true,
      default: [],
      description: 'API scopes/permissions (e.g., ["read:products", "write:orders"])'
    },
    rateLimit: {
      maxRequests: {
        type: Number,
        default: 1000,
        description: 'Max requests allowed'
      },
      windowMs: {
        type: Number,
        default: 3600000, // 1 hour
        description: 'Time window in milliseconds'
      }
    },
    ipWhitelist: {
      type: [String],
      default: [],
      description: 'Allowed IP addresses (empty = all IPs allowed)'
    },
    expiresAt: {
      type: Date,
      description: 'Expiration date (null = never expires)'
    },
    lastUsedAt: {
      type: Date,
      description: 'Last time this key was used'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      description: 'Whether the key is active'
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      description: 'Additional metadata'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ keyPrefix: 1, isActive: 1 });
apiKeySchema.index({ businessId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });

// Pre-save middleware to hash the API key
apiKeySchema.pre('save', async function (next) {
  try {
    // Only hash if the key is being modified (during creation)
    if (!this.isModified('hashedKey')) {
      return next();
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

// Method to compare plain key with hashed key
apiKeySchema.methods.compareKey = async function (plainKey: string): Promise<boolean> {
  return bcrypt.compare(plainKey, this.hashedKey);
};

// Static method to generate a new API key
apiKeySchema.statics.generateKey = function (): { key: string; prefix: string } {
  // Generate a secure random key: carta_live_<random64chars>
  const randomBytes = crypto.randomBytes(48);
  const key = `carta_live_${randomBytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)}`;
  const prefix = key.substring(0, 20); // carta_live_ + first 8 chars

  return { key, prefix };
};

// Static method to hash a key
apiKeySchema.statics.hashKey = async function (key: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(key, salt);
};

// Virtual to check if key is expired
apiKeySchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to check if key is valid for use
apiKeySchema.methods.isValid = function (): boolean {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

// Method to check if IP is whitelisted
apiKeySchema.methods.isIpAllowed = function (ip: string): boolean {
  if (!this.ipWhitelist || this.ipWhitelist.length === 0) return true;
  return this.ipWhitelist.includes(ip);
};

// Method to check if scope is allowed
apiKeySchema.methods.hasScope = function (scope: string): boolean {
  if (this.scopes.includes('*')) return true; // Full access
  return this.scopes.includes(scope);
};

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
