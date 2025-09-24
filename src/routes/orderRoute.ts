import { Router } from "express"
import { autoChangeStatus, toggleArchived, getAll , getAllAdmin,getOrder, changeStatus} from "../controllers/orderController"

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

export default router
