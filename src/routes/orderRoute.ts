import { Router } from "express"
import { autoChangeStatus, toggleArchived, getAll , getAllAdmin,getOrder, changeStatus, getArchivedOrdersController, create} from "../controllers/orderController"

const router = Router()

// Toggle order archived status
// PATCH /api/v1/order/:orderId/toggle-archived
router.patch("/:orderId/toggle-archived", toggleArchived)

// Get archived orders
// GET /api/v1/order/archived/:subDomain/:localId
router.get("/archived/:subDomain/:localId", getArchivedOrdersController)

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

// Create order (chatbot endpoint)
// POST /api/v1/order?subDomain=xxx&localId=xxx
router.post("/", create)

export default router
