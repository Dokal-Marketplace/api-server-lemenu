import { Router } from "express"
import homeRoute from "./homeRoute"
import healthRoute from "./healthRoute"
import logsRoute from "./logsRoute"

const router = Router()

router.use("/", homeRoute)
router.use("/health", healthRoute)
router.use("/logs", logsRoute)

export default router
