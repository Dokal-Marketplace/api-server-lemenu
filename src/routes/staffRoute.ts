import { Router } from "express";
import  authenticate from "../middleware/auth";
import { , getRoles } from "../controllers/staffController";

const router = Router();

// GET /api/v1/roles
router.get("/roles", authenticate, getRoles);


export default router;


