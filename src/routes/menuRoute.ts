import { Router } from "express"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"
import { getProductInMenu } from "../controllers/menuController";

const router = Router()

// POST /menu/getProductInMenu/{localId}/{subDomain} - Get Product Details in Menu
router.post("/getProductInMenu/:localId/:subDomain", tokenAuthHandler, getProductInMenu)

export default router
