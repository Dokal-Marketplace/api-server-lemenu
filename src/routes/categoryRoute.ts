import { Router } from "express"
import { getCategory, getCategories, updateCategory, deleteCategory, createCategory } from "../controllers/categoryController";

const router = Router()


router.post("/", createCategory);
router.get("/", getCategory);
router.get("/get-all", getCategories);
router.patch("/", updateCategory);
router.delete("/", deleteCategory);

export default router
