import mongoose, { Schema, Document } from "mongoose";

export interface IModifier {
  id: string;
  name: string;
  price: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface IProduct extends Document {
  rId: string;
  name: string;
  description?: string;
  categoryId: string;
  category: string; // Category name
  basePrice: number;
  isCombo: boolean;
  stock: number;
  isOutOfStock: boolean;
  isAvailable: boolean; // Availability status
  imageUrl?: string;
  imageFile?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
  };
  modifiers: IModifier[];
  presentations: string[]; // Array of presentation IDs
  tags: string[];
  subDomain: string;
  localId: string;
  isActive: boolean;
  // New fields from types
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  allergens: string[];
  preparationTime: number; // Estimated prep time in minutes
  isFeatured: boolean; // Featured product flag
  sortOrder: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

const ModifierSchema = new Schema<IModifier>({
  id: {
    type: String,
    required: true
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
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
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
    maxlength: 1000
  },
  categoryId: {
    type: String,
    required: true,
    ref: 'Category'
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  isCombo: {
    type: Boolean,
    default: false
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
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
  imageFile: {
    filename: {
      type: String,
      trim: true
    },
    originalName: {
      type: String,
      trim: true
    },
    mimetype: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    path: {
      type: String,
      trim: true
    }
  },
  modifiers: [ModifierSchema],
  presentations: [{
    type: String,
    ref: 'Presentation'
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
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
  },
  // New fields from types
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
    },
    sodium: {
      type: Number,
      min: 0
    }
  },
  allergens: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  preparationTime: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ name: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isCombo: 1 });
ProductSchema.index({ isOutOfStock: 1 });
ProductSchema.index({ isAvailable: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ subDomain: 1 });
ProductSchema.index({ localId: 1 });
ProductSchema.index({ presentations: 1 });
ProductSchema.index({ 'modifiers.isActive': 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ sortOrder: 1 });
ProductSchema.index({ preparationTime: 1 });
ProductSchema.index({ allergens: 1 });

// Text search index for product search
ProductSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  category: 'text',
  allergens: 'text'
});

// Post-save hook: Auto-sync product to category catalog
ProductSchema.post('save', async function(doc: IProduct) {
  try {
    const { CatalogSyncService } = await import('../services/catalog/catalogSyncService');
    const { Business } = await import('./Business');
    const logger = (await import('../utils/logger')).default;

    // Check if business has catalog sync enabled
    const business = await Business.findOne({ subDomain: doc.subDomain });

    if (!business || business.catalogSyncEnabled === false) {
      return;
    }

    // Only sync active products
    if (!doc.isActive) {
      logger.debug('Skipping sync for inactive product', { productId: doc.rId });
      return;
    }

    logger.info('Auto-syncing product to category catalog', {
      productId: doc.rId,
      categoryId: doc.categoryId,
      isNew: this.isNew
    });

    // Sync product to its category catalog
    const result = await CatalogSyncService.syncProductToCatalog(doc);

    if (result.success) {
      logger.debug('Product auto-synced successfully', {
        productId: doc.rId,
        catalogId: result.catalogId,
        action: result.action
      });
    } else {
      logger.warn('Product auto-sync failed', {
        productId: doc.rId,
        error: result.error
      });
    }
  } catch (error: any) {
    const logger = (await import('../utils/logger')).default;
    logger.error('Failed to auto-sync product:', {
      productId: doc.rId,
      error: error.message
    });
    // Don't throw - sync failure shouldn't break product save
  }
});

// Post-remove hook: Remove product from catalog
ProductSchema.post('remove', async function(doc: IProduct) {
  try {
    const { CatalogSyncService } = await import('../services/catalog/catalogSyncService');
    const logger = (await import('../utils/logger')).default;

    logger.info('Auto-removing product from catalog', {
      productId: doc.rId,
      subDomain: doc.subDomain
    });

    await CatalogSyncService.removeProductFromCatalog(
      doc.rId,
      doc.subDomain,
      undefined,
      doc.localId
    );

    logger.debug('Product auto-removed from catalog', {
      productId: doc.rId
    });
  } catch (error: any) {
    const logger = (await import('../utils/logger')).default;
    logger.error('Failed to auto-remove product from catalog:', {
      productId: doc.rId,
      error: error.message
    });
  }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
