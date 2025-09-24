import { Router } from "express"
import {
  createProduct,
  convertToModifier,
  deleteProduct,
  getProduct,
  getAll,
  updateProduct,
  getProducts,
  batchCreateProduct
} from "../controllers/productsController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

// GET all products for a location: /products/get-all/:subDomain/:localId
router.get("/get-all/:subDomain/:localId", tokenAuthHandler, getAll)

// Optional generic list with query filters
router.get("/", tokenAuthHandler, getProducts)

// Create product for a location: /products/:subDomain/:localId
router.post("/:subDomain/:localId", tokenAuthHandler, createProduct)

// Create product with presentations: /products/with-presentation/:subDomain/:localId
router.post("/with-presentation/:subDomain/:localId", tokenAuthHandler, batchCreateProduct)

// Get single product by id: /products/:productId
router.get("/:productId", tokenAuthHandler, getProduct)

// Update product by id: /products/:productId
router.patch("/:productId", tokenAuthHandler, updateProduct)

// Delete product by id: /products/:productId
router.delete("/:productId", tokenAuthHandler, deleteProduct)

// Convert to modifier: /products/convert-to-modifier
router.post("/convert-to-modifier", tokenAuthHandler, convertToModifier)

export default router;
