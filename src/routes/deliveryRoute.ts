import { Router } from "express"
import { getHealth } from "../controllers/healthController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

router.get("/", tokenAuthHandler, getAll)
router.get("/companies", tokenAuthHandler, getCompanies)
router.get("/drivers", tokenAuthHandler, getDrivers)
router.patch("/drivers", tokenAuthHandler, updateDriver)
router.delete("/drivers", tokenAuthHandler, deleteDriver)
router.get("/drivers", tokenAuthHandler, getDriver)

export default router
