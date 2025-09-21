import { Router } from "express"
import { addIntegration } from "../controllers/integrationImportController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.post("/", tokenAuthHandler, addIntegration)

export default router
