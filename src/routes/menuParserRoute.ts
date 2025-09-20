import { Router } from "express"
import { uploadMenu } from "../controllers/menuExcelController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/upload", tokenAuthHandler, uploadMenu)

export default router
