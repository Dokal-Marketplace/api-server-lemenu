import { Router } from "express"
import { getCategory, getCategories, updateCategory, deleteCategory, createCategory } from "../controllers/categoryController";

const router = Router()

// Existing routes
router.post("/", createCategory);
router.get("/", getCategory);
router.get("/get-all", getCategories);
router.patch("/", updateCategory);
router.delete("/", deleteCategory);

// New path parameter routes to match API documentation
// GET /categorias/get-all/{subDomain}/{localId} - Get All Categories
router.get("/get-all/:subDomain/:localId", getCategories);

// PATCH /categorias/{categoryId} - Update Category
router.patch("/:categoryId", updateCategory);

// DELETE /categorias/{categoryId} - Delete Category
router.delete("/:categoryId", deleteCategory);

export default router
