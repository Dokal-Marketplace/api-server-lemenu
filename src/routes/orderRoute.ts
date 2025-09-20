import { Router } from "express"
import { getExamples } from "../controllers/orderController"

const router = Router()

router.get("/toggle-archived", getExamples)
router.get("/auto-change-status", getExamples)
router.get("/filled-orders", getExamples)
router.get("/filled-orders/admin", getExamples)
router.get("/get-order", getExamples)
router.get("/change-status", getExamples)


export default router
