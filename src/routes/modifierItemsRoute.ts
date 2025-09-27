import { Router } from "express"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"
import {
  createModifierItem,
  updateModifierItem,
  deleteModifierItem,
  getModifierItem,
  getAllModifierItems,
  getModifierItemsByLocation
} from "../controllers/modifierItemsController"

const router = Router()

// POST /modificador-items - Create Modifier Item
router.post("/", tokenAuthHandler, createModifierItem)

// PATCH /modificador-items/{itemId} - Update Modifier Item
router.patch("/:itemId", tokenAuthHandler, updateModifierItem)

// DELETE /modificador-items/{itemId} - Delete Modifier Item
router.delete("/:itemId", tokenAuthHandler, deleteModifierItem)

// GET /modificador-items/{itemId} - Get Specific Modifier Item
router.get("/:itemId", tokenAuthHandler, getModifierItem)

// GET /modificador-items - Get All Modifier Items for a Modifier
router.get("/", tokenAuthHandler, getAllModifierItems)

// GET /modificador-items/location/{subDomain}/{localId} - Get Modifier Items by Location
router.get("/location/:subDomain/:localId", tokenAuthHandler, getModifierItemsByLocation)

export default router
