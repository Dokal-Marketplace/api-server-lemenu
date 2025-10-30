import mongoose, { Schema, Document, Types } from 'mongoose'

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'CANCELLED' | 'EXPIRED' | 'PROCESSING'

export interface IPayment extends Document {
  provider: 'pawapay' | string
  depositId: string
  businessId?: Types.ObjectId
  packCode?: string
  amount: { currency: string; value: number }
  status: PaymentStatus
  idempotencyKey: string
  failureReason?: string
  raw?: any
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>({
  provider: { type: String, required: true, index: true },
  depositId: { type: String, required: true, index: true, unique: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', index: true },
  packCode: { type: String },
  amount: {
    currency: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  status: { type: String, required: true, enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'PROCESSING'], default: 'PENDING', index: true },
  idempotencyKey: { type: String, required: true, index: true },
  failureReason: { type: String },
  raw: { type: Schema.Types.Mixed },
}, { timestamps: true })

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema)


