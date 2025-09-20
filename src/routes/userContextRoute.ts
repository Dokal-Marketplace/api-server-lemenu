import { Router } from "express"
import { getBotContext, updateBotContext } from "../controllers/botContextController"

const router = Router()

router.get("/get-one", getBotContext)
router.patch("/update-is-on", updateBotContext)

export default router
