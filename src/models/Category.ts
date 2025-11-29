import mongoose, { Document, Schema } from 'mongoose'

export interface ICategory extends Document {
  rId: string
  name: string
  description?: string
  imageUrl?: string
  position: number
  subDomain: string
  localId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
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
  imageUrl: {
    type: String,
    trim: true
  },
  position: {
    type: Number,
    required: true,
    min: 0,
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
})

CategorySchema.index({ name: 1 })
CategorySchema.index({ subDomain: 1, localId: 1 })
CategorySchema.index({ isActive: 1 })

// Post-save hook: Auto-create catalog for new categories
CategorySchema.post('save', async function(doc: ICategory) {
  // Only create catalog for newly created active categories
  if (this.isNew && doc.isActive) {
    try {
      const { MetaCatalogService } = await import('../services/whatsapp/metaCatalogService');
      const { Business } = await import('./Business');

      // Get business to check if catalog sync is enabled
      const business = await Business.findOne({ subDomain: doc.subDomain });

      if (!business || business.catalogSyncEnabled === false) {
        return; // Skip if business not found or sync disabled
      }

      // Check if business has WhatsApp/Meta configured
      if (!business.whatsappAccessToken || !business.fbBusinessId) {
        return; // Skip if Meta integration not configured
      }

      const logger = (await import('../utils/logger')).default;

      logger.info('Auto-creating catalog for new category', {
        categoryId: doc.rId,
        categoryName: doc.name,
        subDomain: doc.subDomain
      });

      // Create catalog via Meta API
      const catalogName = `${business.name} - ${doc.name}`;
      const catalog = await MetaCatalogService.createCatalog(
        {
          name: catalogName,
          vertical: 'commerce'
        },
        doc.subDomain,
        doc.localId
      );

      // Update business with new catalog mapping
      if (!business.fbCatalogMapping) {
        business.fbCatalogMapping = {} as any;
      }

      const mapping = business.fbCatalogMapping as any;
      mapping[doc.rId] = catalog.id;
      business.fbCatalogMapping = mapping;

      await business.save();

      logger.info('Catalog auto-created for category', {
        categoryId: doc.rId,
        catalogId: catalog.id
      });
    } catch (error: any) {
      const logger = (await import('../utils/logger')).default;
      logger.error('Failed to auto-create catalog for category:', {
        categoryId: doc.rId,
        error: error.message
      });
      // Don't throw - catalog creation failure shouldn't break category creation
    }
  }
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema)


