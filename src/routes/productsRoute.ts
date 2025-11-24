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

// Existing routes
// GET all products for a location: /products/get-all/:subDomain/:localId
router.get("/get-all/:subDomain/:localId", getAll)

// Optional generic list with query filters
router.get("/", getProducts)

// Create product for a location: /products/:subDomain/:localId
router.post("/:subDomain/:localId", createProduct)

// Create product with presentations: /products/with-presentation/:subDomain/:localId
router.post("/with-presentation/:subDomain/:localId", batchCreateProduct)

// Get single product by id: /products/:productId
router.get("/:productId", getProduct)

// Update product by id: /products/:productId
router.patch("/:productId", updateProduct)

// Delete product by id: /products/:productId
router.delete("/:productId", deleteProduct)

// Convert to modifier: /products/convert-to-modifier
router.post("/convert-to-modifier",convertToModifier)

// Catalog sync routes
// POST /products/sync-to-catalog/:subDomain/:localId - Batch sync all products to catalog
router.post("/sync-to-catalog/:subDomain/:localId", syncProductsToCatalog)

// POST /products/sync-product-to-catalog/:productId - Sync single product to catalog
router.post("/sync-product-to-catalog/:productId", syncSingleProductToCatalog)

// POST /products/sync-availability/:productId - Sync product availability only
router.post("/sync-availability/:productId", syncProductAvailability)

// GET /products/sync-status/:subDomain/:localId - Get sync status
router.get("/sync-status/:subDomain/:localId", getSyncStatus)

// New path parameter routes to match API documentation
// POST /productos/{subDomain}/{localId} - Create Product (already exists above)
// POST /productos/with-presentation/{subDomain}/{localId} - Create Product with Presentation (already exists above)
// PATCH /productos/{productId} - Update Product (already exists above)
// DELETE /productos/{productId} - Delete Product (already exists above)
// POST /productos/convert-to-modifier - Convert Product to Modifier (already exists above)

export default router;
