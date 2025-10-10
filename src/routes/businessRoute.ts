// routes/businessRoutes.ts
import { Router } from "express";
import {
  createBusiness,
  createLocal,
  getBusiness,
  getBusinesses,
  getBusinessLocal,
  updateBusinessLocal,
  deleteBusiness,
  toggleBusinessStatus,
  searchBusinesses,
  getBusinessesByLocation,
  getAllBusinessesAdmin,
  updateBusinessBySubdomainAndLocal,
  getLocalsForSubdomain,
  toggleStatusBySubAndLocal
} from "../controllers/businessController";

import {
  validateCreateBusiness,
  validateCreateBusinessLocation,
  validateUpdateBusiness,
  validateBusinessQuery,
  validateBusinessStatusToggle,
  validateBusinessId,
  validateSearchQuery
} from "../middleware/businessValidation";

import authenticate from "../middleware/auth";

// Optional: Add authentication middleware
// import { authenticateToken, optionalAuth } from "../middleware/auth";

const router = Router();


// Existing routes (maintaining backward compatibility)
router.get("/", validateBusinessQuery, getBusiness);
router.get("/locals", validateBusinessQuery, getBusinessLocal);
router.get("/owner/businesses", authenticate, validateBusinessQuery, getBusinesses);
router.post("/v2/create-complete", authenticate, validateCreateBusiness, createBusiness);
router.patch("/update", authenticate, validateUpdateBusiness, updateBusinessLocal);
router.post("/new-local", authenticate, validateCreateBusinessLocation, createLocal);

// Additional useful routes
router.delete("/:id", authenticate, validateBusinessId, deleteBusiness);
router.patch("/:id/status", authenticate, validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);
router.get("/search", validateSearchQuery, validateBusinessQuery, searchBusinesses);
router.get("/location", validateBusinessQuery, getBusinessesByLocation);

// API.md alias routes for backward compatibility with documented paths
// GET /api/v1/business?subDomain={subDomain}&businessLocationId={businessLocationId} already covered by '/'

// PATCH /api/v1/business/update/{subDomain}/{businessLocationId}
router.patch("/update/:subDomain/:businessLocationId", authenticate, validateUpdateBusiness, updateBusinessBySubdomainAndLocal);

// GET /api/v1/business/locals/{subDomain}
router.get("/locals/:subDomain", validateBusinessQuery, getLocalsForSubdomain);

// PATCH /api/v1/business/{subDomain}/{businessLocationId}/status
router.patch("/:subDomain/:businessLocationId/status", toggleStatusBySubAndLocal);

// GET /api/v1/business/admin/businesses
router.get("/admin/businesses", authenticate, validateBusinessQuery, getAllBusinessesAdmin);

// Routes with authentication (uncomment if you have auth middleware)
// router.get("/owner/businesses", authenticateToken, validateBusinessQuery, getBusinesses);
// router.post("/v2/create-complete", authenticateToken, validateCreateBusiness, createBusiness);
// router.patch("/update", authenticateToken, validateUpdateBusiness, updateBusinessLocal);
// router.post("/new-local", authenticateToken, validateCreateBusiness, createLocal);
// router.delete("/:id", authenticateToken, validateBusinessId, deleteBusiness);
// router.patch("/:id/status", authenticateToken, validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);

export default router;