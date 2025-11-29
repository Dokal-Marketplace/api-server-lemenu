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
import {
  syncSingleProductToCatalog,
  syncProductsToCatalog,
  getSyncStatus,
  syncProductAvailability
} from "../controllers/catalogSyncController"

const router = Router()

// IMPORTANT: Specific routes must come before generic parameter routes
// to avoid route matching conflicts

// GET all products for a location: /products/get-all/:subDomain/:localId
router.get("/get-all/:subDomain/:localId", getAll)

// Optional generic list with query filters
router.get("/", getProducts)

// Catalog sync routes (MUST be before /:productId routes)
// POST /products/sync-to-catalog/:subDomain/:localId - Batch sync all products to catalog
router.post("/sync-to-catalog/:subDomain/:localId", syncProductsToCatalog)

// POST /products/sync-product-to-catalog/:productId - Sync single product to catalog
router.post("/sync-product-to-catalog/:productId", syncSingleProductToCatalog)

// POST /products/sync-availability/:productId - Sync product availability only
router.post("/sync-availability/:productId", syncProductAvailability)

// GET /products/sync-status/:subDomain/:localId - Get sync status
router.get("/sync-status/:subDomain/:localId", getSyncStatus)

// Convert to modifier: /products/convert-to-modifier
router.post("/convert-to-modifier",convertToModifier)

// Create product with presentations: /products/with-presentation/:subDomain/:localId
router.post("/with-presentation/:subDomain/:localId", batchCreateProduct)

// Create product for a location: /products/:subDomain/:localId
router.post("/:subDomain/:localId", createProduct)

// Get single product by id: /products/:productId
router.get("/:productId", getProduct)

// Update product by id: /products/:productId
router.patch("/:productId", updateProduct)

// Delete product by id: /products/:productId
router.delete("/:productId", deleteProduct)

export default router;
