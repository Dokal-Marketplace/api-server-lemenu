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
import menuParserRoute from "./menuParserRoute"
import menuExcelRoute from "./menuExcelRoute"
import botContextRoute from "./botContextRoute"
import userContextRoute from "./userContextRoute"
import combosRoute from "./combosRoute"
import whatsappRoute from "./whatsappRoute"


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
router.use("/menu-parser", menuParserRoute)
router.use("/menu-excel", menuExcelRoute)
router.use("/bot-ctx", botContextRoute)
router.use("/user-ctx", userContextRoute)
router.use("/combos", combosRoute)
router.use("/whatsapp-providers", whatsappRoute)


router.use("/history", metricsRoute)

router.use("/notifications", metricsRoute)


export default router
