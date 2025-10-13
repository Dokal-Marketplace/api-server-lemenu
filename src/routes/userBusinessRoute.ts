import { Router } from "express"
import { createUserBusinessRelationship, getUserBusinesses } from "../controllers/authController"

const router = Router()

// GET /user-business/get-by-user-id/{userId} - Get User Businesses
router.get("/get-by-user-id/:userId", getUserBusinesses)

// POST /user-business/create - Create User-Business Relationship
router.post("/create", createUserBusinessRelationship)

export default router
