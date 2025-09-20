import { Router } from "express"
import { deleteDriver, getDriver, getAll, getCompanies, getDrivers, updateDriver  } from "../controllers/deliveryController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/", tokenAuthHandler, getAll)
router.get("/companies", tokenAuthHandler, getCompanies)
router.get("/drivers", tokenAuthHandler, getDrivers)
router.patch("/drivers", tokenAuthHandler, updateDriver)
router.delete("/drivers", tokenAuthHandler, deleteDriver)
router.get("/drivers", tokenAuthHandler, getDriver)

export default router
