import { Router } from "express"
import { login, signup, facebookCallback } from "../controllers/authController"

const router = Router()

router.post("/login", login)
router.post("/signup", signup)
router.post("/callback/facebook", facebookCallback)

export default router