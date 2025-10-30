import { Router } from 'express'
import authenticate from '../middleware/auth'
import { getBusinessCreditsBalance, getBusinessCreditsLedger } from '../controllers/creditsBalanceController'

const router = Router()

// GET /api/v1/business/:businessId/credits/balance
router.get('/business/:businessId/credits/balance', authenticate, getBusinessCreditsBalance)

// GET /api/v1/business/:businessId/credits/ledger
router.get('/business/:businessId/credits/ledger', authenticate, getBusinessCreditsLedger)

export default router


