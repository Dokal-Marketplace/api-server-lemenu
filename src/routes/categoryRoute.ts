import { Router } from "express"
import { getCategory, getCategories, updateCategory, deleteCategory, createCategory } from "../controllers/categoryController";
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

// Existing routes
router.post("/", tokenAuthHandler, createCategory);
router.get("/", tokenAuthHandler, getCategory);
router.get("/get-all", tokenAuthHandler, getCategories);
router.patch("/", tokenAuthHandler, updateCategory);
router.delete("/", tokenAuthHandler, deleteCategory);

// New path parameter routes to match API documentation
// GET /categorias/get-all/{subDomain}/{localId} - Get All Categories
router.get("/get-all/:subDomain/:localId", tokenAuthHandler, getCategories);

// PATCH /categorias/{categoryId} - Update Category
router.patch("/:categoryId", tokenAuthHandler, updateCategory);

// DELETE /categorias/{categoryId} - Delete Category
router.delete("/:categoryId", tokenAuthHandler, deleteCategory);

export default router
