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
  getDeliveryZones,
  getDeliveryZoneById,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyById,
  getCompanyWithDrivers,
  getDriversByCompany,
  calculateDeliveryCost
} from "../controllers/deliveryController"

const router = Router()

// ⚠️ SPECIFIC ROUTES FIRST (before generic ones)

// Companies
// GET /api/v1/delivery/companies/:subDomain/:localId
router.get("/companies/:subDomain/:localId", getCompanies)
// GET /api/v1/delivery/companies/:companyId/:subDomain/:localId
router.get("/companies/:companyId/:subDomain/:localId", getCompanyById)
// GET /api/v1/delivery/companies/:companyId/with-drivers/:subDomain/:localId
router.get("/companies/:companyId/with-drivers/:subDomain/:localId", getCompanyWithDrivers)
// GET /api/v1/delivery/companies/:companyId/drivers/:subDomain/:localId
router.get("/companies/:companyId/drivers/:subDomain/:localId", getDriversByCompany)
// POST /api/v1/delivery/companies/:subDomain/:localId
router.post("/companies/:subDomain/:localId", createCompany)
// PATCH /api/v1/delivery/companies/:companyId/:subDomain/:localId
router.patch("/companies/:companyId/:subDomain/:localId", updateCompany)
// DELETE /api/v1/delivery/companies/:companyId/:subDomain/:localId
router.delete("/companies/:companyId/:subDomain/:localId", deleteCompany)

// Delivery zones
// GET /api/v1/delivery/zones/:subDomain/:localId
router.get("/zones/:subDomain/:localId", getDeliveryZones)
// GET /api/v1/delivery/zones/:zoneId/:subDomain/:localId
router.get("/zones/:zoneId/:subDomain/:localId", getDeliveryZoneById)
// POST /api/v1/delivery/zones/:subDomain/:localId
router.post("/zones/:subDomain/:localId", createDeliveryZone)
// PATCH /api/v1/delivery/zones/:zoneId/:subDomain/:localId
router.patch("/zones/:zoneId/:subDomain/:localId", updateDeliveryZone)
// DELETE /api/v1/delivery/zones/:zoneId/:subDomain/:localId
router.delete("/zones/:zoneId/:subDomain/:localId", deleteDeliveryZone)

// Delivery cost calculation
// POST /api/v1/delivery/calculate-cost
router.post("/calculate-cost", calculateDeliveryCost)

// Drivers - specific paths first
// GET /api/v1/delivery/drivers/available/:subDomain/:localId
router.get("/drivers/available/:subDomain/:localId", getAvailableDrivers)
// GET /api/v1/delivery/drivers/:subDomain/:localId
router.get("/drivers/:subDomain/:localId", getDrivers)
// POST /api/v1/delivery/drivers/:subDomain/:localId
router.post("/drivers/:subDomain/:localId", createDriver)
// GET /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.get("/drivers/:driverId/:subDomain/:localId", getDriver)
// PATCH /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.patch("/drivers/:driverId/:subDomain/:localId", updateDriver)
// PATCH /api/v1/delivery/drivers/:driverId/location/:subDomain/:localId
router.patch("/drivers/:driverId/location/:subDomain/:localId", updateDriverLocation)
// PATCH /api/v1/delivery/drivers/:driverId/status/:subDomain/:localId
router.patch("/drivers/:driverId/status/:subDomain/:localId", updateDriverStatus)
// DELETE /api/v1/delivery/drivers/:driverId/:subDomain/:localId
router.delete("/drivers/:driverId/:subDomain/:localId", deleteDriver)

// ⚠️ GENERIC CATCH-ALL ROUTE LAST
// GET /api/v1/delivery/:subDomain/:localId
router.get("/:subDomain/:localId", getAll)

export default router