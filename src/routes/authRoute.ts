import { Router } from "express"
import { 
  login, 
  signup, 
  facebookCallback, 
  facebookWebhookVerification, 
  facebookWebhookHandler 
} from "../controllers/authController"

const router = Router()

router.post("/login", login)
router.post("/signup", signup)

// Facebook OAuth callback (POST)
router.post("/callback/facebook", facebookCallback)

// Facebook/Workplace webhook endpoints
router.get("/webhook/facebook", facebookWebhookVerification)
router.post("/webhook/facebook", facebookWebhookHandler)

export default router