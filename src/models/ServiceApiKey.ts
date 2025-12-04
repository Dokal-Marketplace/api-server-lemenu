import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface IServiceApiKey extends Document {
  name: string;
  serviceName: string;
  serviceType: 'internal' | 'external' | 'partner';
  keyPrefix: string;
  hashedKey: string;
  scopes: string[];
  allowedServices?: string[];
  allowedEndpoints?: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  ipWhitelist?: string[];
  environment: 'development' | 'staging' | 'production';
  expiresAt?: Date;
  lastUsedAt?: Date;
  requestCount: number;
  isActive: boolean;
  metadata?: {
    version?: string;
    description?: string;
    owner?: string;
    contactEmail?: string;
    [key: string]: any;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  compareKey(plainKey: string): Promise<boolean>;
  isValid(): boolean;
  isIpAllowed(ip: string): boolean;
  hasScope(scope: string): boolean;
  isEndpointAllowed(endpoint: string): boolean;
  isServiceAllowed(targetService: string): boolean;
}

const serviceApiKeySchema = new Schema<IServiceApiKey>(
  {
    // Human-readable name for the service API key
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    // Name of the service using this key (e.g., "order-processor", "analytics-service")
    serviceName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    // Type of service: internal (our microservices), external (third-party), partner (trusted partners)
    serviceType: {
      type: String,
      enum: ['internal', 'external', 'partner'],
      required: true,
      default: 'internal'
    },
    // First characters of the key for identification
    keyPrefix: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    // Bcrypt hashed full API key
    hashedKey: {
      type: String,
      required: true,
      unique: true
    },
    // Service scopes (e.g., ["service:orders", "service:products"])
    scopes: {
      type: [String],
      required: true,
      default: []
    },
    // List of services this key can communicate with (empty = all services)
    allowedServices: {
      type: [String]
    },
    // Specific endpoint patterns allowed (e.g., ["/api/v1/orders/*", "/api/v1/products/*"])
    allowedEndpoints: {
      type: [String]
    },
    rateLimit: {
      // Max requests allowed (higher for services)
      maxRequests: {
        type: Number,
        default: 10000
      },
      // Time window in milliseconds
      windowMs: {
        type: Number,
        default: 3600000 // 1 hour
      }
    },
    // Allowed IP addresses or CIDR ranges
    ipWhitelist: {
      type: [String],
      default: []
    },
    // Environment this key is valid for
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      required: true,
      default: 'development',
      index: true
    },
    // Expiration date (null = never expires)
    expiresAt: {
      type: Date
    },
    // Last time this key was used
    lastUsedAt: {
      type: Date
    },
    // Total number of requests made with this key
    requestCount: {
      type: Number,
      default: 0
    },
    // Whether the key is active
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    metadata: {
      version: { type: String },
      description: { type: String },
      owner: { type: String },
      contactEmail: { type: String },
      type: Schema.Types.Mixed,
      default: {}
    },
    // Admin or system that created this key
    createdBy: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
serviceApiKeySchema.index({ serviceName: 1, environment: 1 });
serviceApiKeySchema.index({ keyPrefix: 1, isActive: 1 });
serviceApiKeySchema.index({ serviceType: 1, isActive: 1 });
serviceApiKeySchema.index({ expiresAt: 1 });
serviceApiKeySchema.index({ environment: 1, isActive: 1 });

// Pre-save middleware
serviceApiKeySchema.pre('save', async function (next) {
  try {
    // Increment request count is handled elsewhere
    next();
  } catch (err) {
    next(err as any);
  }
});

// Method to compare plain key with hashed key
serviceApiKeySchema.methods.compareKey = async function (plainKey: string): Promise<boolean> {
  return bcrypt.compare(plainKey, this.hashedKey);
};

// Static method to generate a service API key
serviceApiKeySchema.statics.generateKey = function (
  serviceType: 'internal' | 'external' | 'partner' = 'internal'
): { key: string; prefix: string } {
  // Generate based on service type
  let keyType: string;
  switch (serviceType) {
    case 'internal':
      keyType = 'srv';
      break;
    case 'external':
      keyType = 'ext';
      break;
    case 'partner':
      keyType = 'prt';
      break;
    default:
      keyType = 'srv';
  }

  // Format: carta_{type}_<env>_<random64chars>
  const randomBytes = crypto.randomBytes(48);
  const key = `carta_${keyType}_${randomBytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 64)}`;
  const prefix = key.substring(0, 25); // carta_{type}_ + first 12 chars

  return { key, prefix };
};

// Static method to hash a key
serviceApiKeySchema.statics.hashKey = async function (key: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(key, salt);
};

// Virtual to check if key is expired
serviceApiKeySchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to check if key is valid for use
serviceApiKeySchema.methods.isValid = function (): boolean {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

// Method to check if IP is allowed
serviceApiKeySchema.methods.isIpAllowed = function (ip: string): boolean {
  if (!this.ipWhitelist || this.ipWhitelist.length === 0) return true;

  // Support CIDR notation and exact IP matches
  return this.ipWhitelist.some((allowedIp: string) => {
    if (allowedIp.includes('/')) {
      // CIDR notation - simplified check (production should use proper CIDR library)
      const [network] = allowedIp.split('/');
      return ip.startsWith(network.split('.').slice(0, 3).join('.'));
    }
    return allowedIp === ip;
  });
};

// Method to check if scope is allowed
serviceApiKeySchema.methods.hasScope = function (scope: string): boolean {
  if (this.scopes.includes('*')) return true; // Full access
  return this.scopes.includes(scope);
};

// Method to check if endpoint is allowed
serviceApiKeySchema.methods.isEndpointAllowed = function (endpoint: string): boolean {
  if (!this.allowedEndpoints || this.allowedEndpoints.length === 0) return true;

  return this.allowedEndpoints.some((pattern: string) => {
    // Simple wildcard matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(endpoint);
  });
};

// Method to check if service is allowed
serviceApiKeySchema.methods.isServiceAllowed = function (targetService: string): boolean {
  if (!this.allowedServices || this.allowedServices.length === 0) return true;
  return this.allowedServices.includes(targetService);
};

export const ServiceApiKey = mongoose.model<IServiceApiKey>('ServiceApiKey', serviceApiKeySchema);
