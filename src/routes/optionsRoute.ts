import { Router } from "express"
import { createMultipleBusinessLocation, update, deleteOne, create, getAll } from "../controllers/optionsController";

const router = Router()

// GET routes
router.get("/get-all", getAll);

// POST routes
router.post("/create", create);
router.post("/create-multiple", createMultipleBusinessLocation);

// PATCH and DELETE routes
router.patch("/update", update);
router.delete("/delete", deleteOne);

export default router
