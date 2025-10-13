import { Router } from "express"
import { createModif, batchUpdateModif, deleteModif, batchCreateModif, getModif, getAll, updateModif, getModifs  } from "../controllers/modificadoresController"

const router = Router()

router.get("/get-all", getAll)
router.get("/", getModifs)
router.patch("/update-by-rid", updateModif)
router.patch("/", updateModif)
router.delete("/", deleteModif)
router.get("/", getModif)
router.post("/create", createModif)
router.post("/update-multiple-local", batchUpdateModif)
router.post("/create-multiple-local", batchCreateModif)


export default router
