

import { Router } from "express"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"
import { findOne } from "../controllers/notificationsController"

const router = Router()

router.get("/unread", findOne)
router.get("/", tokenAuthHandler, findOne)

export default router
