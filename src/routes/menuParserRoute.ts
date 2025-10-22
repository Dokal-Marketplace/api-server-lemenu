import { Router } from "express"
import multer from "multer"
import { uploadMenuParser } from "../controllers/menuParserController"

const router = Router()

// Configure multer for menu parser image uploads (memory storage for MinIO)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for images
  },
  fileFilter: (_req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// POST /api/v1/menu-parser/upload/{subDomain}/{localId}
router.post("/upload/:subDomain/:localId", upload.single('file'), uploadMenuParser)

export default router
