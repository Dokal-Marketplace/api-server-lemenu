import { Router } from "express"
import {
  getAllOptionsByLocationController,
  getOptionsByModifierController,
  getOptionsByModifierRIdController,
  getOptionByIdController,
  createOptionController,
  updateOptionController,
  deleteOptionController,
  batchCreateOptionsController,
  batchUpdateOptionsController,
  batchDeleteOptionsController,
  searchOptionsController,
  getOptionsWithPaginationController
} from "../controllers/optionsController"

const router = Router()

// GET /options/:subDomain/:localId - Get all options for a location
router.get("/get-all/:subDomain/:localId", getAllOptionsByLocationController)

// GET /options/modifier/:modifierId - Get options for a specific modifier
router.get("/modifier/:modifierId", getOptionsByModifierController)

// GET /options/modifier-rid/:modifierRId - Get options by modifier rId
router.get("/modifier-rid/:modifierRId", getOptionsByModifierRIdController)

// GET /options/:modifierId/:optionId - Get a specific option
router.get("/:modifierId/:optionId", getOptionByIdController)

// GET /options - Get options with pagination and filters
router.get("/", getOptionsWithPaginationController)

// GET /options/search - Search options
router.get("/search", searchOptionsController)

// POST /options - Create a new option
router.post("/", createOptionController)

// POST /options/batch-create - Batch create options
router.post("/batch-create", batchCreateOptionsController)

// POST /options/batch-update - Batch update options
router.post("/batch-update", batchUpdateOptionsController)

// POST /options/batch-delete - Batch delete options
router.post("/batch-delete", batchDeleteOptionsController)

// PATCH /options/:modifierId/:optionId - Update an option
router.patch("/:modifierId/:optionId", updateOptionController)

// DELETE /options/:modifierId/:optionId - Delete an option
router.delete("/:modifierId/:optionId", deleteOptionController)

export default router
