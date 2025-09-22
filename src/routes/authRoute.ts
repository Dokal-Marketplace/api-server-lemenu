import { Router } from "express"
import { login, signup } from "../controllers/authController"
// no auth required for login/signup
const router = Router()

router.post("/login", login)
router.post("/signup", signup)

export default router