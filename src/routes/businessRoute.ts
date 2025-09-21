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
  getBusinessesByLocation
} from "../controllers/businessController";

import {
  validateCreateBusiness,
  validateUpdateBusiness,
  validateBusinessQuery,
  validateBusinessStatusToggle,
  validateBusinessId,
  validateSearchQuery
} from "../middleware/businessValidation";

// Optional: Add authentication middleware
// import { authenticateToken, optionalAuth } from "../middleware/auth";

const router = Router();

// Existing routes (maintaining backward compatibility)
router.get("/", validateBusinessQuery, getBusiness);
router.get("/locals", validateBusinessQuery, getBusinessLocal);
router.get("/owner/businesses", validateBusinessQuery, getBusinesses);
router.post("/v2/create-complete", validateCreateBusiness, createBusiness);
router.patch("/update", validateUpdateBusiness, updateBusinessLocal);
router.post("/new-local", validateCreateBusiness, createLocal);

// Additional useful routes
router.delete("/:id", validateBusinessId, deleteBusiness);
router.patch("/:id/status", validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);
router.get("/search", validateSearchQuery, validateBusinessQuery, searchBusinesses);
router.get("/location", validateBusinessQuery, getBusinessesByLocation);

// Routes with authentication (uncomment if you have auth middleware)
// router.get("/owner/businesses", authenticateToken, validateBusinessQuery, getBusinesses);
// router.post("/v2/create-complete", authenticateToken, validateCreateBusiness, createBusiness);
// router.patch("/update", authenticateToken, validateUpdateBusiness, updateBusinessLocal);
// router.post("/new-local", authenticateToken, validateCreateBusiness, createLocal);
// router.delete("/:id", authenticateToken, validateBusinessId, deleteBusiness);
// router.patch("/:id/status", authenticateToken, validateBusinessId, validateBusinessStatusToggle, toggleBusinessStatus);

export default router;