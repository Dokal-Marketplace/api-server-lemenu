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

const router = Router()

// CRUD operations
router.post("/", createCombo);
router.get("/", getCombos);
router.get("/categories", getCategories);
router.get("/stats", getComboStats);
//FIXME
router.get("/local",getComboStats);
router.get("/:id", getCombo);
router.patch("/:id", updateCombo);
router.delete("/:id", deleteCombo);

export default router
