import { Router } from "express"
import {
  createModifierItem,
  updateModifierItem,
  deleteModifierItem,
  getModifierItem,
  getAllModifierItems,
  getModifierItemsByLocation,
  batchCreateModifierItems,
  batchUpdateModifierItems,
  batchDeleteModifierItems
} from "../controllers/modifierItemsController"

const router = Router()

// GET /modifier-items/location/:subDomain/:localId - Get Modifier Items by Location
router.get("/:subDomain/:localId", getModifierItemsByLocation)

// GET /modifier-items - Get All Modifier Items for a Modifier (requires modifierId query param)
router.get("/", getAllModifierItems)

// POST /modifier-items - Create Modifier Item (requires modifierId in body)
router.post("/", createModifierItem)

// POST /modifier-items/batch-create - Batch Create Modifier Items
router.post("/batch-create", batchCreateModifierItems)

// POST /modifier-items/batch-update - Batch Update Modifier Items
router.post("/batch-update", batchUpdateModifierItems)

// POST /modifier-items/batch-delete - Batch Delete Modifier Items
router.post("/batch-delete", batchDeleteModifierItems)

// GET /modifier-items/:itemId - Get Specific Modifier Item (requires modifierId query param)
router.get("/:itemId", getModifierItem)

// PATCH /modifier-items/:itemId - Update Modifier Item (requires modifierId in body)
router.patch("/:itemId", updateModifierItem)

// DELETE /modifier-items/:itemId - Delete Modifier Item (requires modifierId in body)
router.delete("/:itemId", deleteModifierItem)

export default router
