import mongoose, { Schema, Document, Types } from 'mongoose'

export type CreditLedgerType = 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment' | 'reversal'

export interface ICreditLedger extends Document {
  businessId: Types.ObjectId
  type: CreditLedgerType
  creditsDelta: number
  balanceAfter: number
  orderId?: Types.ObjectId
  packCode?: string
  amountMoney?: { currency: string; value: number }
  idempotencyKey?: string
  source?: 'web' | 'whatsapp' | 'mobile_money' | 'admin' | 'system'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const CreditLedgerSchema = new Schema<ICreditLedger>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  type: { type: String, required: true, enum: ['purchase', 'consume', 'refund', 'bonus', 'adjustment', 'reversal'] },
  creditsDelta: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  packCode: { type: String },
  amountMoney: {
    currency: { type: String },
    value: { type: Number, min: 0 },
  },
  idempotencyKey: { type: String, index: true },
  source: { type: String, enum: ['web', 'whatsapp', 'mobile_money', 'admin', 'system'], default: 'system' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true })

CreditLedgerSchema.index({ businessId: 1, createdAt: -1 })

export const CreditLedger = mongoose.model<ICreditLedger>('CreditLedger', CreditLedgerSchema)


