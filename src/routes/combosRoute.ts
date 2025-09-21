import { Router } from "express"
import { getCombo, getCategories, updateCombo, deleteCombo, createCombo } from "../controllers/combosController";

const router = Router()


router.post("/", createCombo);
router.get("/", getCategories);
router.get("/local", getCombo);
router.patch("/", updateCombo);
router.delete("/", deleteCombo);

export default router
