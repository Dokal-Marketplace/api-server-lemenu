import { Router } from "express"
import { 
  createMultipleBusinessLocation, 
  update, 
  deleteOne, 
  create, 
  getAll,
  getById,
  getByRId,
  toggleActive,
  updateStock,
  getByCategory,
  getByModifier,
  batchDelete
} from "../controllers/optionsController";

const router = Router()

// Get all options with filtering and pagination
// GET /api/v1/options/get-all?subDomain=xxx&localId=xxx&category=xxx&page=1&limit=20
router.get("/get-all", getAll);

// Get option by ID
// GET /api/v1/options/:optionId
router.get("/:optionId", getById);

// Get option by rId
// GET /api/v1/options/rid/:rId
router.get("/rid/:rId", getByRId);

// Get options by category
// GET /api/v1/options/category/:category?subDomain=xxx&localId=xxx
router.get("/category/:category", getByCategory);

// Get options by modifier
// GET /api/v1/options/modifier/:modifierId
router.get("/modifier/:modifierId", getByModifier);

// Create single option
// POST /api/v1/options/:subDomain/:localId
router.post("/:subDomain/:localId", create);

// Create multiple options
// POST /api/v1/options/create-multiple-business-location/:subDomain/:localId
router.post("/create-multiple-business-location/:subDomain/:localId", createMultipleBusinessLocation);

// Update option
// PATCH /api/v1/options/:optionId
router.patch("/:optionId", update);

// Toggle option active status
// PATCH /api/v1/options/:optionId/toggle-active
router.patch("/:optionId/toggle-active", toggleActive);

// Update option stock
// PATCH /api/v1/options/:optionId/stock
router.patch("/:optionId/stock", updateStock);

// Delete single option
// DELETE /api/v1/options/:optionId
router.delete("/:optionId", deleteOne);

// Batch delete options by rIds
// DELETE /api/v1/options/batch
router.delete("/batch", batchDelete);

export default router
