import { Router } from "express";
import authenticate from "../middleware/auth";
import { 
  getRoles, 
  getStaff, 
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
  validateUpdateStaff
} from "../controllers/staffController";

const router = Router();

// Role endpoints
// GET /api/v1/staff/roles/:subDomain
router.get("/roles/:subDomain", authenticate, getRoles);

// Staff CRUD endpoints
// GET /api/v1/staff/:subDomain - Get all staff for subdomain
router.get("/:subDomain", authenticate, getStaff);

// GET /api/v1/staff/:subDomain/staff/:staffId - Get specific staff member
router.get("/:subDomain/staff/:staffId", authenticate, getStaffById);

// POST /api/v1/staff/:subDomain - Create new staff member
router.post("/:subDomain", authenticate, validateCreateStaff, createStaff);

// PUT /api/v1/staff/:subDomain/staff/:staffId - Update staff member
router.put("/:subDomain/staff/:staffId", authenticate, validateUpdateStaff, updateStaff);

// DELETE /api/v1/staff/:subDomain/staff/:staffId - Delete staff member
router.delete("/:subDomain/staff/:staffId", authenticate, deleteStaff);

// Statistics and analytics endpoints
// GET /api/v1/staff/:subDomain/stats - Get staff statistics
router.get("/:subDomain/stats", authenticate, getStaffStats);

// GET /api/v1/staff/:subDomain/:localId/stats - Get staff statistics for specific local
router.get("/:subDomain/:localId/stats", authenticate, getStaffStats);

// Search endpoints
// GET /api/v1/staff/:subDomain/search - Search staff
router.get("/:subDomain/search", authenticate, searchStaff);

// GET /api/v1/staff/:subDomain/:localId/search - Search staff in specific local
router.get("/:subDomain/:localId/search", authenticate, searchStaff);

// Performance endpoints
// GET /api/v1/staff/:subDomain/staff/:staffId/performance - Get staff performance
router.get("/:subDomain/staff/:staffId/performance", authenticate, getStaffPerformance);

// PUT /api/v1/staff/:subDomain/staff/:staffId/performance - Update staff performance
router.put("/:subDomain/staff/:staffId/performance", authenticate, updateStaffPerformance);

// Keep generic two-segment route after literal second-segment routes to avoid shadowing
// GET /api/v1/staff/:subDomain/:localId - Get staff for specific local
router.get("/:subDomain/:localId", authenticate, getStaffByLocal);

export default router;


