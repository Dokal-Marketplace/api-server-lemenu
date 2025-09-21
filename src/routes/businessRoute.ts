import { Router } from "express"
import { createBusiness, createLocal, getBusiness, getBusinesses, getBusinessLocal, updateBusinessLocal } from "../controllers/businessController"

const router = Router()

router.get("/", getBusiness)
router.get("/locals", getBusinessLocal)
router.get("/owner/businesses", getBusinesses)
router.post("/v2/create-complete", createBusiness)
router.patch("/update", updateBusinessLocal)
router.post("/new-local", createLocal)

export default router
