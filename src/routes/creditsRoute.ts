import { Router } from 'express'
import authenticate from '../middleware/auth'
import { 
  getUserCredits, 
  getUserCreditUsage, 
  updateUserCredits 
} from '../controllers/creditsController'

const router = Router()

// GET /api/v1/user/credits - Get user credits
router.get('/credits', authenticate, getUserCredits)

// GET /api/v1/user/credits/usage - Get user credit usage
router.get('/credits/usage', authenticate, getUserCreditUsage)

// POST /api/v1/user/credits/update - Update user credits (admin only)
router.post('/credits/update', authenticate, updateUserCredits)

export default router
