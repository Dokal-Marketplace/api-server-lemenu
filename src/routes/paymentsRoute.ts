import { Router } from 'express'
import { pawapayCallback } from '../controllers/pawapayController'

const router = Router()

router.post('/payments/pawapay/callback', pawapayCallback)

export default router


