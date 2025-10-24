import { Router } from "express"
import { login, signup, facebookCallback, testCallback } from "../controllers/authController"

const router = Router()

router.post("/login", login)
router.post("/signup", signup)
router.post("/callback/facebook", facebookCallback)
router.get("/callback/facebook", facebookCallback)
router.get("/test", testCallback)

export default router