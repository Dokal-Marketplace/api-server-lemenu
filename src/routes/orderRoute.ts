import { Router } from "express"
import { autoChangeStatus, toggleArchived, getAll , getAllAdmin,getOrder, changeStatus} from "../controllers/orderController"

const router = Router()

router.patch("/toggle-archived", toggleArchived)
router.get("/auto-change-status", autoChangeStatus)
router.get("/filled-orders", getAll)
router.get("/filled-orders/admin", getAllAdmin)
router.get("/get-order", getOrder)
router.post("/change-status", changeStatus)
router.patch("/", changeStatus)


export default router
