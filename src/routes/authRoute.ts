import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
  login,
  signup,
  facebookCallback,
  facebookWebhookVerification,
  facebookWebhookHandler
} from "../controllers/authController"

const router = Router()

// Rate limiting for auth endpoints to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    type: "429",
    message: "Too many login attempts. Please try again after 15 minutes.",
    data: null
  }
})

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 signup attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    type: "429",
    message: "Too many signup attempts. Please try again after 15 minutes.",
    data: null
  }
})

router.post("/login", loginLimiter, login)
router.post("/signup", signupLimiter, signup)

// Facebook OAuth callback (POST)
router.post("/callback/facebook", facebookCallback)

// Facebook/Workplace webhook endpoints
router.get("/webhook/facebook", facebookWebhookVerification)
router.post("/webhook/facebook", facebookWebhookHandler)

export default router