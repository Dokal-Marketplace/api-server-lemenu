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
router.patch("/:subDomain/:localId/status", toggleStatusBySubAndLocal);

// GET /api/v1/business/admin/businesses
router.get("/admin/businesses", authenticate, validateBusinessQuery, getAllBusinessesAdmin);


export default router;