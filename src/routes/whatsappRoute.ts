import { Router } from "express"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"
import { sendMessage } from "../controllers/whatsappController"

const router = Router()

router.get("/send-message", tokenAuthHandler, sendMessage)

export default router
