import { Router } from "express"
import { allChatGrouped, getHistory, lastMessage } from "src/controllers/historyController"

const router = Router()

router.get("/all-chats-grouped",allChatGrouped)
router.get("/get-history",getHistory)
router.get("/last-messages",lastMessage)

export default router
