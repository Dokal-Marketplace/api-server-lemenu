import { Request, Response } from 'express'
import { getBalance } from '../services/creditsService'
import { CreditLedger } from '../models/CreditLedger'

export async function getBusinessCreditsBalance(req: Request, res: Response) {
  try {
    const businessId = req.params.businessId || (req.query.businessId as string)
    if (!businessId) return res.status(400).json({ success: false, message: 'Missing businessId' })
    const balance = await getBalance(businessId)
    return res.status(200).json({ success: true, data: balance })
  } catch (err) {
    console.error('getBusinessCreditsBalance error', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export async function getBusinessCreditsLedger(req: Request, res: Response) {
  try {
    const businessId = req.params.businessId || (req.query.businessId as string)
    if (!businessId) return res.status(400).json({ success: false, message: 'Missing businessId' })
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)))
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      CreditLedger.find({ businessId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CreditLedger.countDocuments({ businessId })
    ])
    return res.status(200).json({ success: true, data: { items, page, limit, total } })
  } catch (err) {
    console.error('getBusinessCreditsLedger error', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}


