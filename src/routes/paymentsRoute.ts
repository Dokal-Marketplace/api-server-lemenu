import { Router } from 'express'
import { pawapayCallback, createPawaPayPaymentPage } from '../controllers/pawapayController'
import { validateCreatePawaPayPaymentPage, handleValidationErrors } from '../middleware/paymentsValidation'

const router = Router()

router.post('/payments/pawapay/callback', pawapayCallback)
router.post(
  '/payments/pawapay/paymentpage',
  validateCreatePawaPayPaymentPage,
  handleValidationErrors,
  createPawaPayPaymentPage
)

export default router


