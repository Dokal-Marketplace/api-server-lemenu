import { Router } from "express"
import { getHealth } from "../controllers/healthController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/", tokenAuthHandler, getHealth)

export default router
