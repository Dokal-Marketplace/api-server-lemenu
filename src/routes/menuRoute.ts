import { Router } from "express"
import { getProductInMenu } from "../controllers/menuController";

const router = Router()

// POST /menu/getProductInMenu/{localId}/{subDomain} - Get Product Details in Menu
router.post("/getProductInMenu/:localId/:subDomain", getProductInMenu)

export default router
