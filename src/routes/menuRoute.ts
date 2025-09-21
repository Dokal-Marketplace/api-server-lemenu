import { Router } from "express"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"
import { getProductInMenu } from "../controllers/menuController";

const router = Router()

router.get("/getProductInMenu", tokenAuthHandler, getProductInMenu )

export default router
