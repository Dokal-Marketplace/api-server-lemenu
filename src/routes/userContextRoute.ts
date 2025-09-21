import { Router } from "express"
import { findOne, findAll, updateChatOn } from "../controllers/userContextController"

const router = Router()

router.get("/find-one", findOne)
router.patch("/update-chat-on", updateChatOn)
router.get("/find-all", findAll)

export default router
