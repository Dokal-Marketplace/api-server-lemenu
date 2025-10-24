import { Router } from "express"
import authenticate from "../middleware/auth"
import { 
  getFacebookProfile, 
  getFacebookPages, 
  postToFacebookPage 
} from "../controllers/facebookController"

const router = Router()

// All routes require authentication
router.use(authenticate)

// Facebook API endpoints
router.get("/profile", getFacebookProfile)
router.get("/pages", getFacebookPages)
router.post("/post", postToFacebookPage)


export default router
