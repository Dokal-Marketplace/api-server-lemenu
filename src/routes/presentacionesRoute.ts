import { Router } from "express"
import { getByProduct, update, deleteOne, create, getAll, getAllLikeProduct } from "../controllers/presentacionesController";

const router = Router()

// GET routes
router.get("/get-all/:subDomain/:localId", getAll);
router.get("/get-all-like-product/:subDomain/:localId", getAllLikeProduct);
router.get("/by-product/:subDomain/:localId", getByProduct);

// POST routes
router.post("/create/:subDomain/:localId", create);

// PATCH and DELETE routes
router.patch("/:presentationId", update);
router.delete("/:presentationId", deleteOne);

export default router
