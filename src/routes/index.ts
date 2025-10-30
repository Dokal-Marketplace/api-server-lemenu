import { Router } from "express"
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
import modifierItemsRoute from "./modifierItemsRoute"
import presentacionesRoute from "./presentacionesRoute"
import integrationImportRoute from "./IntegrationImportRoute"
import menuParserRoute from "./menuParserRoute"
import menuExcelRoute from "./menuExcelRoute"
import menuPicRoute from "./menuPicRoute"
import botContextRoute from "./botContextRoute"
import userContextRoute from "./userContextRoute"
import combosRoute from "./combosRoute"
import whatsappRoute from "./whatsappRoute"
import notificationsRoute from "./notificationsRoute"
import historyRoute from "./historyRoute"
import authRoute from "./authRoute"
import userBusinessRoute from "./userBusinessRoute"
import eventsRoute from "./eventsRoute"
import staffRoute from "./staffRoute"
import creditsRoute from "./creditsRoute"
import facebookRoute from "./facebookRoute"
import workingHoursRoute from "./workingHoursRoute"
import paymentsRoute from "./paymentsRoute"
import businessCreditsRoute from "./businessCreditsRoute"
import authenticate from "../middleware/auth"
import { getUserProfile } from "../controllers/authController"


const router = Router()

router.get("/user", authenticate, getUserProfile)
router.use("/user", creditsRoute)
router.use("/health", healthRoute)
router.use("/auth", authRoute)
router.use("/facebook", facebookRoute)
router.use("/user-business", userBusinessRoute)
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
router.use("/modifiers", modificadoresRoute)
router.use("/modifier-items", modifierItemsRoute)
router.use("/presentations", presentacionesRoute)
router.use("/integration-import", integrationImportRoute)
router.use("/menu-parser", menuParserRoute)
router.use("/menu-excel", menuExcelRoute)
router.use("/menu-pic", menuPicRoute)
router.use("/bot-ctx", botContextRoute)
router.use("/user-ctx", userContextRoute)
router.use("/combos", combosRoute)
router.use("/whatsapp-providers", whatsappRoute)
router.use("/notifications", notificationsRoute)
router.use("/history", historyRoute)
// Limit socket-related HTTP endpoints under /socket.io
router.use("/socket.io", eventsRoute)
router.use("/staff", staffRoute)
router.use("/business/working-hours", workingHoursRoute)
router.use("/", paymentsRoute)
router.use("/", businessCreditsRoute)



export default router
