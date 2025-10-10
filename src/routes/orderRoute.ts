import { Router } from "express"
import { 
  autoChangeStatus, 
  changeStatus, 
  create, 
  getAll, 
  getAllAdmin, 
  getByCustomer, 
  getByStatus, 
  getOrder, 
  getStats, 
  remove, 
  search, 
  toggleArchived, 
  update 
} from "../controllers/orderController"

const router = Router()

// Not in API docs, kept for compatibility
router.patch("/toggle-archived", toggleArchived)

// Configure auto status change
// POST /api/v1/order/change-status/:subDomain/:localId
router.post("/change-status/:subDomain/:localId", autoChangeStatus)

// Get orders for restaurant
// GET /api/v1/order/filled-orders/:subDomain/:localId
router.get("/filled-orders/:subDomain/:localId", getAll)

// Get orders for admin (paginated)
// GET /api/v1/order/filled-orders/admin
router.get("/filled-orders/admin", getAllAdmin)

// Get specific order
// GET /api/v1/order/get-order/:orderId
router.get("/get-order/:orderId", getOrder)

// Update order status
// PATCH /api/v1/order/:orderId/status
router.patch("/:orderId/status", changeStatus)

// Create new order
// POST /api/v1/order
router.post("/", create)

// Update order
// PATCH /api/v1/order/:orderId
router.patch("/:orderId", update)

// Delete order
// DELETE /api/v1/order/:orderId
router.delete("/:orderId", remove)

// Search orders with filters
// GET /api/v1/order/search
router.get("/search", search)

// Get order statistics
// GET /api/v1/order/stats
router.get("/stats", getStats)

// Get orders by customer phone
// GET /api/v1/order/customer/:customerPhone
router.get("/customer/:customerPhone", getByCustomer)

// Get orders by status
// GET /api/v1/order/status/:status
router.get("/status/:status", getByStatus)

export default router
