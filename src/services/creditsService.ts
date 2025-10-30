import mongoose from 'mongoose'
import { Business } from '../models/Business'
import { CreditPack } from '../models/CreditPack'
import { CreditLedger } from '../models/CreditLedger'

export async function getBalance(businessId: string) {
  const business = await Business.findById(businessId).select('creditsTotal creditsUsed overdraftLimit')
  if (!business) throw new Error('BUSINESS_NOT_FOUND')
  const total = business.creditsTotal || 0
  const used = business.creditsUsed || 0
  const available = total - used
  const overdraftLimit = business.overdraftLimit || 0
  return {
    total,
    used,
    available,
    overdraftLimit,
    effectiveAvailable: available + overdraftLimit,
  }
}

export function resolvePackFromAmount(currency: string, value: number): string | undefined {
  const key = `${currency.toUpperCase()}-${Number(value).toFixed(2)}`
  const map: Record<string, string> = {
    'USD-3.00': 'STARTER_20',
    'USD-12.00': 'VALUE_100',
    'USD-50.00': 'BUSINESS_500',
    'USD-80.00': 'MEGA_1000',
  }
  return map[key]
}

async function appendLedgerEntry(params: {
  businessId: string
  type: 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment' | 'reversal'
  creditsDelta: number
  balanceAfter: number
  orderId?: string
  packCode?: string
  amountMoney?: { currency: string; value: number }
  idempotencyKey?: string
  source?: 'web' | 'whatsapp' | 'mobile_money' | 'admin' | 'system'
  metadata?: Record<string, any>
}, session: mongoose.ClientSession) {
  await CreditLedger.create([{
    businessId: new mongoose.Types.ObjectId(params.businessId),
    type: params.type,
    creditsDelta: params.creditsDelta,
    balanceAfter: params.balanceAfter,
    orderId: params.orderId ? new mongoose.Types.ObjectId(params.orderId) : undefined,
    packCode: params.packCode,
    amountMoney: params.amountMoney,
    idempotencyKey: params.idempotencyKey,
    source: params.source || 'system',
    metadata: params.metadata,
  }], { session })
}

export async function purchaseCredits(
  businessId: string,
  packCode: string,
  paymentInfo: { amount: { currency: string; value: number }; provider: string; depositId: string },
  idempotencyKey: string
) {
  const pack = await CreditPack.findOne({ code: packCode, isActive: true })
  if (!pack) throw new Error('PACK_NOT_FOUND')

  const creditsToAdd = pack.credits + Math.floor((pack.bonusPercent || 0) * pack.credits / 100)

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const business = await Business.findById(businessId).session(session).select('creditsTotal creditsUsed')
      if (!business) throw new Error('BUSINESS_NOT_FOUND')

      const newTotal = (business.creditsTotal || 0) + creditsToAdd
      const availableAfter = newTotal - (business.creditsUsed || 0)

      await Business.updateOne({ _id: business._id }, { $set: { creditsTotal: newTotal } }, { session })

      await appendLedgerEntry({
        businessId,
        type: 'purchase',
        creditsDelta: creditsToAdd,
        balanceAfter: availableAfter,
        packCode,
        amountMoney: paymentInfo.amount,
        idempotencyKey,
        source: 'mobile_money',
        metadata: { provider: paymentInfo.provider, depositId: paymentInfo.depositId },
      }, session)
    })
  } finally {
    await session.endSession()
  }
}

export async function consumeOneForOrder(businessId: string, orderId: string, reason?: string) {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const business = await Business.findById(businessId).session(session).select('creditsTotal creditsUsed overdraftLimit')
      if (!business) throw new Error('BUSINESS_NOT_FOUND')
      const total = business.creditsTotal || 0
      const used = business.creditsUsed || 0
      const available = total - used
      const overdraftLimit = business.overdraftLimit || 0

      const canUse = available > 0 || (used - total) < overdraftLimit
      if (!canUse) throw new Error('INSUFFICIENT_CREDITS')

      await Business.updateOne({ _id: business._id }, { $inc: { creditsUsed: 1 } }, { session })
      const balanceAfter = (total - (used + 1))

      await appendLedgerEntry({
        businessId,
        type: 'consume',
        creditsDelta: -1,
        balanceAfter,
        orderId,
        metadata: { reason },
      }, session)
    })
  } finally {
    await session.endSession()
  }
}

export async function reverseConsume(businessId: string, orderId: string, reason?: string) {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const business = await Business.findById(businessId).session(session).select('creditsTotal creditsUsed')
      if (!business) throw new Error('BUSINESS_NOT_FOUND')
      const total = business.creditsTotal || 0
      const used = business.creditsUsed || 0

      // Ensure there is a corresponding consume to reverse
      const priorConsume = await CreditLedger.findOne({
        businessId: business._id,
        orderId: new mongoose.Types.ObjectId(orderId),
        type: 'consume',
      }).session(session)
      if (!priorConsume) {
        throw new Error('NO_CONSUME_TO_REVERSE')
      }

      // Prevent negative creditsUsed
      if (used <= 0) {
        throw new Error('NO_USAGE_TO_REVERSE')
      }

      await Business.updateOne({ _id: business._id }, { $inc: { creditsUsed: -1 } }, { session })
      const balanceAfter = total - (used - 1)

      await appendLedgerEntry({
        businessId,
        type: 'reversal',
        creditsDelta: +1,
        balanceAfter,
        orderId,
        metadata: { reason },
      }, session)
    })
  } finally {
    await session.endSession()
  }
}


