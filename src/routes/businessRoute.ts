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
  validateUpdateBusiness,
  validateBusinessQuery,
  validateBusinessStatusToggle,
  validateBusinessId,
  validateSearchQuery
} from "../middleware/businessValidation";

import authenticate, { requireRole } from "../middleware/auth";

// Optional: Add authentication middleware
// import { authenticateToken, optionalAuth } from "../middleware/auth";

const router = Router();

// Existing routes (maintaining backward compatibility)
router.get("/", validateBusinessQuery, getBusiness);
router.get("/locals", validateBusinessQuery, getBusinessLocal);
router.get("/owner/businesses", authenticate, validateBusinessQuery, getBusinesses);
router.post("/v2/create-complete", authenticate, validateCreateBusiness, createBusiness);
router.patch("/update", authenticate, validateUpdateBusiness, updateBusinessLocal);
router.post("/new-local", authenticate, validateCreateBusiness, createLocal);

// Additional useful routes
router.delete("/:id", authenticate, validateBusinessId, deleteBusiness);
router.patch("/:id/status", authenticate, validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);
router.get("/search", validateSearchQuery, validateBusinessQuery, searchBusinesses);
router.get("/location", validateBusinessQuery, getBusinessesByLocation);

// API.md alias routes for backward compatibility with documented paths
// GET /api/v1/business?subDomain={subDomain}&localId={localId} already covered by '/'

// PATCH /api/v1/business/update/{subDomain}/{localId}
router.patch("/update/:subDomain/:localId", authenticate, validateUpdateBusiness, updateBusinessBySubdomainAndLocal);

// GET /api/v1/business/locals/{subDomain}
router.get("/locals/:subDomain", validateBusinessQuery, getLocalsForSubdomain);

// PATCH /api/v1/business/{subDomain}/{localId}/status
router.patch("/:subDomain/:localId/status", authenticate, validateBusinessStatusToggle, toggleStatusBySubAndLocal);

// GET /api/v1/business/superadmin/businesses
router.get("/superadmin/businesses", authenticate, requireRole('admin'), validateBusinessQuery, getAllBusinessesAdmin);

// Routes with authentication (uncomment if you have auth middleware)
// router.get("/owner/businesses", authenticateToken, validateBusinessQuery, getBusinesses);
// router.post("/v2/create-complete", authenticateToken, validateCreateBusiness, createBusiness);
// router.patch("/update", authenticateToken, validateUpdateBusiness, updateBusinessLocal);
// router.post("/new-local", authenticateToken, validateCreateBusiness, createLocal);
// router.delete("/:id", authenticateToken, validateBusinessId, deleteBusiness);
// router.patch("/:id/status", authenticateToken, validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);

export default router;