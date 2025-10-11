import { Router } from "express";
import authenticate from "../middleware/auth";
import { 
  getRoles, 
  createRole,
  getStaffById, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getStaffByLocal,
  getStaffStats,
  searchStaff,
  getStaffPerformance,
  updateStaffPerformance,
  validateCreateStaff,
  validateUpdateStaff,
  validateCreateRole
} from "../controllers/staffController";

const router = Router();

// ============================================
// MOST SPECIFIC ROUTES FIRST
// ============================================

// Role endpoints
router.get("/roles/:subDomain/:localId", authenticate, getRoles);
router.post("/roles/:subDomain/:localId", authenticate, validateCreateRole, createRole);

// Search endpoints (literal "search" segment)
router.get("/:subDomain/:localId/search", authenticate, searchStaff);

// Statistics endpoints (literal "stats" segment)
router.get("/:subDomain/:localId/stats", authenticate, getStaffStats);

// Staff member specific endpoints (literal "staff" segment)
router.get("/:subDomain/:localId/staff/:staffId", authenticate, getStaffById);
router.put("/:subDomain/:localId/staff/:staffId", authenticate, validateUpdateStaff, updateStaff);
router.delete("/:subDomain/:localId/staff/:staffId", authenticate, deleteStaff);

// Performance endpoints (nested under staff)
router.get("/:subDomain/:localId/staff/:staffId/performance", authenticate, getStaffPerformance);
router.put("/:subDomain/:localId/staff/:staffId/performance", authenticate, updateStaffPerformance);

// ============================================
// GENERIC ROUTES LAST
// ============================================

// Create staff (POST won't conflict with GETs above)
router.post("/:subDomain/:localId", authenticate, validateCreateStaff, createStaff);

// Get staff by local (generic two-segment pattern)
router.get("/:subDomain/:localId", authenticate, getStaffByLocal);

export default router;