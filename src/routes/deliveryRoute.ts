import { Router } from "express"
import { 
  deleteDriver, 
  getDriver, 
  getAll, 
  getCompanies, 
  getDrivers, 
  updateDriver,
  createDriver,
  updateDriverLocation,
  updateDriverStatus,
  getAvailableDrivers,
  getDeliveryZones
} from "../controllers/deliveryController"

const router = Router()

// General delivery data
// GET /api/v1/delivery/:subDomain/:localId
router.get("/:subDomain/:localId",  getAll)

// Companies
// GET /api/v1/delivery/companies/:subDomain
router.get("/companies/:subDomain",  getCompanies)
router.get("/companies/:subDomain/:localId",  getCompanies)

// Drivers
// GET /api/v1/delivery/drivers/:subDomain/:localId
router.get("/drivers/:subDomain/:localId",  getDrivers)
// GET /api/v1/delivery/drivers/available/:subDomain/:localId
router.get("/drivers/available/:subDomain/:localId",  getAvailableDrivers)
// GET /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.get("/drivers/:driverId/:subDomain/:localId",  getDriver)
// POST /api/v1/delivery/drivers/:subDomain/:localId
router.post("/drivers/:subDomain/:localId",  createDriver)
// PATCH /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.patch("/drivers/:driverId/:subDomain/:localId",  updateDriver)
// PATCH /api/v1/delivery/drivers/:driverId/location/:subDomain/:localId
router.patch("/drivers/:driverId/location/:subDomain/:localId",  updateDriverLocation)
// PATCH /api/v1/delivery/drivers/:driverId/status/:subDomain/:localId
router.patch("/drivers/:driverId/status/:subDomain/:localId",  updateDriverStatus)
// DELETE /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.delete("/drivers/:driverId/:subDomain/:localId",  deleteDriver)

// Delivery zones
// GET /api/v1/delivery/zones/:subDomain/:localId
router.get("/zones/:subDomain/:localId",  getDeliveryZones)

export default router
