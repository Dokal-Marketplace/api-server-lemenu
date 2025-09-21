import { Router } from "express"
import { createModif, batchUpdateModif, deleteModif, batchCreateModif, getModif, getAll, updateModif, getModifs  } from "../controllers/modificadoresController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/get-all", tokenAuthHandler, getAll)
router.get("/", tokenAuthHandler, getModifs)
router.patch("/update-by-rid", tokenAuthHandler, updateModif)
router.patch("/", tokenAuthHandler, updateModif)
router.delete("/", tokenAuthHandler, deleteModif)
router.get("/", tokenAuthHandler, getModif)
router.post("/create", tokenAuthHandler, createModif)
router.post("/update-multiple-local", tokenAuthHandler, batchUpdateModif)
router.post("/create-multiple-local", tokenAuthHandler, batchCreateModif)


export default router
