import { Router } from "express"
import { getUserBusinesses, createUserBusinessRelationship } from "../controllers/authController"
import authenticate from "../middleware/auth"

const router = Router()

// GET /user-business/get-by-user-id/{userId} - Get User Businesses
router.get("/get-by-user-id/:userId", authenticate, getUserBusinesses)

// POST /user-business/create - Create User-Business Relationship
router.post("/create", authenticate, createUserBusinessRelationship)

export default router
