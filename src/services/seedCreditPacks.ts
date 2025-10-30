import { CreditPack } from '../models/CreditPack'

export async function ensureDefaultCreditPacks() {
  const defaults = [
    { code: 'STARTER_20', name: 'Starter Pack', credits: 20, price: { currency: 'USD', value: 3 }, isActive: true, sort: 1 },
    { code: 'VALUE_100', name: 'Value Pack', credits: 100, price: { currency: 'USD', value: 12 }, isActive: true, sort: 2 },
    { code: 'BUSINESS_500', name: 'Business Pack', credits: 500, price: { currency: 'USD', value: 50 }, isActive: true, sort: 3 },
    { code: 'MEGA_1000', name: 'Mega Pack', credits: 1000, price: { currency: 'USD', value: 80 }, isActive: true, sort: 4 },
  ]
  for (const p of defaults) {
    await CreditPack.updateOne({ code: p.code }, { $setOnInsert: p }, { upsert: true })
  }
}


