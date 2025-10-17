import { Router } from "express"
import { 
  getCombo, 
  getCombos, 
  getCategories, 
  updateCombo, 
  deleteCombo, 
  createCombo,
  getComboStats 
} from "../controllers/combosController";
import authenticate from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import { 
  validateCreateCombo,
  validateUpdateCombo,
  validateComboQuery,
  validateComboId,
  validateBusinessContext
} from "../middleware/combosValidation";

const router = Router()

// ============================================
// BUSINESS CONTEXT ROUTES (with subDomain/localId)
// ============================================

// Create combo for specific business location
// POST /api/v1/combos/:subDomain/:localId
router.post("/:subDomain/:localId", 
  authenticate, 
  requireRole('admin'), 
  validateBusinessContext, 
  validateCreateCombo, 
  createCombo
);

// Get combos for specific business location
// GET /api/v1/combos/:subDomain/:localId
router.get("/:subDomain/:localId", 
  authenticate, 
  validateBusinessContext, 
  validateComboQuery, 
  getCombos
);

// Get categories for specific business location
// GET /api/v1/combos/:subDomain/:localId/categories
router.get("/:subDomain/:localId/categories", 
  authenticate, 
  validateBusinessContext, 
  getCategories
);

// Get stats for specific business location
// GET /api/v1/combos/:subDomain/:localId/stats
router.get("/:subDomain/:localId/stats", 
  authenticate, 
  validateBusinessContext, 
  getComboStats
);

// Get specific combo for business location
// GET /api/v1/combos/:subDomain/:localId/:id
router.get("/:subDomain/:localId/:id", 
  authenticate, 
  validateBusinessContext, 
  validateComboId, 
  getCombo
);

// Update combo for business location
// PATCH /api/v1/combos/:subDomain/:localId/:id
router.patch("/:subDomain/:localId/:id", 
  authenticate, 
  requireRole('admin'), 
  validateBusinessContext, 
  validateComboId, 
  validateUpdateCombo, 
  updateCombo
);

// Delete combo for business location
// DELETE /api/v1/combos/:subDomain/:localId/:id
router.delete("/:subDomain/:localId/:id", 
  authenticate, 
  requireRole('admin'), 
  validateBusinessContext, 
  validateComboId, 
  deleteCombo
);

// ============================================
// GLOBAL ROUTES (admin only - no business context)
// ============================================

// Get all combos across all businesses (admin only)
// GET /api/v1/combos
router.get("/", 
  authenticate, 
  requireRole('superadmin'), 
  validateComboQuery, 
  getCombos
);

// Get global categories (admin only)
// GET /api/v1/combos/categories
router.get("/categories", 
  authenticate, 
  requireRole('superadmin'), 
  getCategories
);

// Get global stats (admin only)
// GET /api/v1/combos/stats
router.get("/stats", 
  authenticate, 
  requireRole('superadmin'), 
  getComboStats
);

export default router
