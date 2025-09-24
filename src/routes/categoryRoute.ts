import { Router } from "express"
import { getCategory, getCategories, updateCategory, deleteCategory, createCategory } from "../controllers/categoryController";
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()


router.post("/", tokenAuthHandler, createCategory);
router.get("/", tokenAuthHandler, getCategory);
router.get("/get-all", tokenAuthHandler, getCategories);
router.patch("/", tokenAuthHandler, updateCategory);
router.delete("/", tokenAuthHandler, deleteCategory);

export default router
