// scripts/seed-credit-packs.ts
import 'dotenv/config'
import { connectToDB } from '../src/config/mongoose'
import { ensureDefaultCreditPacks } from '../src/services/seedCreditPacks'

async function main() {
  await connectToDB()
  await ensureDefaultCreditPacks()
  console.log('Seeded default credit packs')
  process.exit(0)
}
main().catch((err: any) => { console.error(err); process.exit(1) })