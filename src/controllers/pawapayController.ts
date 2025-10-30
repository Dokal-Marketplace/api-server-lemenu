import { Request, Response } from 'express'
import { verifyContentDigest, verifyHttpSignature } from '../services/httpSignatureService'
import { resolvePackFromAmount, purchaseCredits } from '../services/creditsService'
import { Payment } from '../models/Payment'

export async function pawapayCallback(req: Request, res: Response) {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body)
    const digestHeader = req.header('Content-Digest') || ''
    const signature = req.header('Signature') || ''
    const signatureInput = req.header('Signature-Input') || ''
    const signatureDate = req.header('Signature-Date') || ''

    if (digestHeader && !verifyContentDigest(rawBody, digestHeader)) {
      return res.status(400).send('Invalid Content-Digest')
    }
    if ((signature || signatureInput || signatureDate) && !verifyHttpSignature({ rawBody, signature, signatureInput, signatureDate })) {
      return res.status(400).send('Invalid Signature')
    }

    const { depositId, status, amount, metadata } = req.body || {}
    if (!depositId || !status || !amount) {
      return res.status(400).send('Missing fields')
    }

    let payment = await Payment.findOne({ depositId })
    if (!payment) {
      payment = await Payment.create({
        provider: 'pawapay',
        depositId,
        status: 'PENDING',
        amount,
        businessId: metadata?.businessId,
        packCode: metadata?.packCode,
        idempotencyKey: depositId,
        raw: req.body,
      })
    }

    if (['COMPLETED', 'SUCCESS'].includes(String(status).toUpperCase())) {
      if (payment.status === 'COMPLETED') {
        return res.status(200).send('OK')
      }

      const businessId = metadata?.businessId || payment.businessId?.toString()
      let packCode = metadata?.packCode || payment.packCode
      if (!packCode) {
        packCode = resolvePackFromAmount(amount.currency, amount.value)
      }
      if (!businessId || !packCode) {
        await Payment.updateOne({ _id: payment._id }, { status: 'FAILED', failureReason: 'MISSING_BUSINESS_OR_PACK' })
        return res.status(400).send('Missing business or pack')
      }

      await purchaseCredits(businessId, packCode, { amount, provider: 'pawapay', depositId }, depositId)
      await Payment.updateOne({ _id: payment._id }, { status: 'COMPLETED' })
      return res.status(200).send('OK')
    }

    if (['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED'].includes(String(status).toUpperCase())) {
      if (payment.status !== 'COMPLETED') {
        await Payment.updateOne({ _id: payment._id }, { status: String(status).toUpperCase() })
      }
      return res.status(200).send('OK')
    }

    await Payment.updateOne({ _id: payment._id }, { status: String(status).toUpperCase() })
    return res.status(200).send('OK')
  } catch (err) {
    console.error('pawaPay callback error', err)
    return res.status(500).send('Internal error')
  }
}


