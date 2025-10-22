import { Router } from "express"
import { getHealth, getS3Health, testS3Connection } from "../controllers/healthController"

const router = Router()

router.get("/", getHealth)
router.get("/s3", getS3Health)
router.get("/s3/test", testS3Connection)

export default router
