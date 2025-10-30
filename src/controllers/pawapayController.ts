import { Request, Response } from 'express'
import { verifyContentDigest, verifyHttpSignature } from '../services/httpSignatureService'
import { purchaseCredits } from '../services/creditsService'
import { Payment } from '../models/Payment'
import { CreditPack } from '../models/CreditPack'
import { Business } from '../models/Business'
import logger from '../utils/logger'

export async function pawapayCallback(req: Request, res: Response) {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body)
    const digestHeader = req.header('Content-Digest') || ''
    const signature = req.header('Signature') || ''
    const signatureInput = req.header('Signature-Input') || ''
    const signatureDate = req.header('Signature-Date') || ''

    if (digestHeader && !verifyContentDigest(rawBody, digestHeader)) {
      logger.error('pawaPay callback digest verification failed', {
        provider: 'pawapay',
        depositId: req.body?.depositId,
        headers: { digestHeader },
      })
      return res.status(400).send('Invalid Content-Digest')
    }
    if ((signature || signatureInput || signatureDate) && !verifyHttpSignature({ rawBody, signature, signatureInput, signatureDate })) {
      logger.error('pawaPay callback signature verification failed', {
        provider: 'pawapay',
        depositId: req.body?.depositId,
        headers: { signaturePresent: !!signature, signatureInputPresent: !!signatureInput, signatureDate },
      })
      return res.status(400).send('Invalid Signature')
    }

    const { depositId, status, amount, metadata } = req.body || {}
    if (!depositId || !status || !amount) {
      logger.error('pawaPay callback missing required fields', {
        provider: 'pawapay',
        depositId,
        status,
        amount,
      })
      return res.status(400).send('Missing fields')
    }

    const payment = await Payment.findOne({ depositId })
    if (!payment) {
      // We expect a pending Payment to be created at initiation time tying the deposit to a business and pack.
      // Do NOT trust metadata here; reject to avoid tampering.
      logger.error('pawaPay callback received unknown depositId', {
        provider: 'pawapay',
        depositId,
        status,
      })
      return res.status(400).send('Unknown depositId')
    }

    if (['COMPLETED', 'SUCCESS'].includes(String(status).toUpperCase())) {
      if (payment.status === 'COMPLETED') {
        return res.status(200).send('OK')
      }

      // Strictly use the business and pack from the initiation record
      const businessId = payment.businessId?.toString()
      const packCode = payment.packCode
      if (!businessId || !packCode) {
        await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', failureReason: 'MISSING_BUSINESS_OR_PACK' })
        logger.error('pawaPay crediting failed: missing businessId or packCode on Payment', {
          provider: 'pawapay',
          depositId,
          paymentId: payment._id,
          businessId,
          packCode,
        })
        return res.status(400).send('Missing business or pack')
      }

      // Validate business exists
      const business = await Business.findById(businessId).select('_id')
      if (!business) {
        await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', failureReason: 'BUSINESS_NOT_FOUND' })
        logger.error('pawaPay crediting failed: business not found', {
          provider: 'pawapay',
          depositId,
          paymentId: payment._id,
          businessId,
        })
        return res.status(400).send('Business not found')
      }

      // Validate pack exists and active
      const pack = await CreditPack.findOne({ code: packCode, isActive: true }).select('code price')
      if (!pack) {
        await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', failureReason: 'PACK_INACTIVE_OR_MISSING' })
        logger.error('pawaPay crediting failed: pack inactive or missing', {
          provider: 'pawapay',
          depositId,
          paymentId: payment._id,
          businessId,
          packCode,
        })
        return res.status(400).send('Pack inactive or missing')
      }

      // Persist callback amount and validate against expected
      await Payment.updateOne({ _id: payment._id }, { $set: { callbackAmount: amount, raw: req.body } })
      const expected = payment.expectedAmount
      if (expected) {
        const sameCurrency = String(expected.currency || '').toUpperCase() === String(amount.currency || '').toUpperCase()
        const sameValue = Number(expected.value) === Number(amount.value)
        if (!sameCurrency || !sameValue) {
          await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', failureReason: 'AMOUNT_MISMATCH' })
          logger.error('pawaPay crediting failed: amount mismatch', {
            provider: 'pawapay',
            depositId,
            paymentId: payment._id,
            businessId,
            packCode,
            expectedAmount: expected,
            callbackAmount: amount,
          })
          return res.status(400).send('Amount mismatch')
        }
      }

      await purchaseCredits(businessId, packCode, { amount, provider: 'pawapay', depositId }, depositId)
      await Payment.updateOne({ _id: payment._id }, { status: 'COMPLETED' })
      return res.status(200).send('OK')
    }

    if (['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED'].includes(String(status).toUpperCase())) {
      if (payment.status !== 'COMPLETED') {
        await Payment.updateOne({ _id: payment._id }, { status: String(status).toUpperCase() })
        logger.error('pawaPay payment final non-success status', {
          provider: 'pawapay',
          depositId,
          paymentId: payment._id,
          finalStatus: String(status).toUpperCase(),
        })
      }
      return res.status(200).send('OK')
    }

    await Payment.updateOne({ _id: payment._id }, { status: String(status).toUpperCase() })
    return res.status(200).send('OK')
  } catch (err) {
    logger.error('pawaPay callback unhandled error', {
      provider: 'pawapay',
      error: err,
    })
    return res.status(500).send('Internal error')
  }
}


