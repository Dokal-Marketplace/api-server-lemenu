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

CategorySchema.index({ rId: 1 })
CategorySchema.index({ name: 1 })
CategorySchema.index({ subDomain: 1, localId: 1 })
CategorySchema.index({ isActive: 1 })

export const Category = mongoose.model<ICategory>('Category', CategorySchema)


