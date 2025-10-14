import { Router } from "express"
import { createModif, batchUpdateModif, deleteModif, batchCreateModif, getModif, getAll, updateModif, getModifs  } from "../controllers/modificadoresController"

const router = Router()

// Get all modifiers for a location: /modificadores/get-all/:subDomain/:localId
router.get("/get-all/:subDomain/:localId", getAll)

// Generic list with query filters: /modificadores
router.get("/", getModifs)

// Create modifier for a location: /modificadores/:subDomain/:localId
router.post("/:subDomain/:localId", createModif)

// Create multiple modifiers for a location: /modificadores/create-multiple/:subDomain/:localId
router.post("/create-multiple/:subDomain/:localId", batchCreateModif)

// Update multiple modifiers for a location: /modificadores/update-multiple/:subDomain/:localId
router.post("/update-multiple/:subDomain/:localId", batchUpdateModif)

// Get single modifier by id: /modificadores/:modifierId
router.get("/:modifierId", getModif)

// Update modifier by id: /modificadores/:modifierId
router.patch("/:modifierId", updateModif)

// Update modifier by rId: /modificadores/update-by-rid
router.patch("/update-by-rid", updateModif)

// Delete modifier by id: /modificadores/:modifierId
router.delete("/:modifierId", deleteModif)

export default router
