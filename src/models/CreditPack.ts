import mongoose, { Schema, Document } from 'mongoose'

export interface ICreditPack extends Document {
  code: 'STARTER_20' | 'VALUE_100' | 'BUSINESS_500' | 'MEGA_1000' | string
  name: string
  credits: number
  price: { currency: string; value: number }
  bonusPercent?: number
  isActive: boolean
  sort: number
  region?: string
  createdAt: Date
  updatedAt: Date
}

const CreditPackSchema = new Schema<ICreditPack>({
  code: { type: String, required: true, index: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: 1 },
  price: {
    currency: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  bonusPercent: { type: Number, required: false, min: 0, max: 100 },
  isActive: { type: Boolean, default: true, index: true },
  sort: { type: Number, default: 0 },
  region: { type: String },
}, { timestamps: true })

export const CreditPack = mongoose.model<ICreditPack>('CreditPack', CreditPackSchema)


