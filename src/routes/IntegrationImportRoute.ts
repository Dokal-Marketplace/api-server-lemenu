import { Router } from "express"
import { addIntegration } from "../controllers/integrationImportController"

const router = Router()

router.post("/", addIntegration)

export default router
