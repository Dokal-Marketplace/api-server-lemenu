import { Router } from "express"
import { login, signup, getUserProfile } from "../controllers/authController"
import authenticate from "../middleware/auth"

const router = Router()

router.post("/login", login)
router.post("/signup", signup)

export default router