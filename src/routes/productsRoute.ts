import { Router } from "express"
import { createProduct, convertToModifier, batchDeleteProduct, deleteProduct, batchCreateProduct, getProduct, getAll, updateProduct, getProducts  } from "../controllers/productsController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/get-all", tokenAuthHandler, getAll)
router.get("/", tokenAuthHandler, getProducts)
router.patch("/update-by-rid", tokenAuthHandler, updateProduct)
router.patch("/", tokenAuthHandler, updateProduct)
router.delete("/", tokenAuthHandler, deleteProduct)
router.get("/", tokenAuthHandler, getProduct)
router.post("/create", tokenAuthHandler, createProduct)
router.post("/delete-multiple-local", tokenAuthHandler, batchDeleteProduct)
router.post("/create-multiple-local", tokenAuthHandler, batchCreateProduct)
router.post("/convert-to-modifier", tokenAuthHandler, convertToModifier)
router.post("/with-presentation", tokenAuthHandler, getAll)


export default router;
