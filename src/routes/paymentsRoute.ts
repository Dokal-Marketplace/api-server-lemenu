import { Router } from 'express'
import { pawapayCallback, createPawaPayPaymentPage } from '../controllers/pawapayController'

const router = Router()

router.post('/payments/pawapay/callback', pawapayCallback)
router.post('/payments/pawapay/paymentpage', createPawaPayPaymentPage)

export default router


