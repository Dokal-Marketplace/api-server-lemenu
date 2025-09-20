import { Router } from "express"
import homeRoute from "./homeRoute"
import healthRoute from "./healthRoute"
import logsRoute from "./logsRoute"
import businessRoute from "./businessRoute"
import metricsRoute from "./metricsRoute"
import categoryRoute from "./categoryRoute"
import menuV2Route from "./menuV2Route"
import menuRoute from "./menuRoute"
import optionsRoute from "./optionsRoute"
import orderRoute from "./orderRoute"
import deliveryRoute from "./deliveryRoute"
import productsRoute from "./productsRoute"
import modificadoresRoute from "./modificadoresRoute"
import presentacionesRoute from "./presentacionesRoute"
import integrationImportRoute from "./IntegrationImportRoute"


const router = Router()

router.use("/", homeRoute)
router.use("/health", healthRoute)
router.use("/logs", logsRoute)
router.use("/business", businessRoute)
router.use("/categories", categoryRoute)
router.use("/menu2", menuV2Route)
router.use("/menu", menuRoute)
router.use("/options", optionsRoute)
router.use("/order", orderRoute)
router.use("/delivery", deliveryRoute)
router.use("/dashboard", metricsRoute)
router.use("/products", productsRoute)
router.use("/modificadores", modificadoresRoute)
router.use("/presentaciones", presentacionesRoute)
router.use("/integration-import", integrationImportRoute)

router.use("/user-ctx", businessRoute)
router.use("/history", metricsRoute)
router.use("/whatsapp-providers", metricsRoute)
router.use("/combos", metricsRoute)
router.use("/menu-excel", metricsRoute)
router.use("/menu-parser", metricsRoute)

router.use("/bot-ctx", businessRoute)
router.use("/notifications", metricsRoute)


export default router
