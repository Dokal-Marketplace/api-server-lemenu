import { Router } from "express"
import multer from "multer"
import { uploadMenuParser } from "../controllers/menuParserController"
import { tokenAuthHandler } from "../middleware/tokenAuthHandler"

const router = Router()

// Configure multer for menu parser image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // TODO: Configure actual upload directory
    cb(null, 'uploads/parser/')
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'parser-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// POST /api/v1/menu-parser/upload/{subDomain}/{localId}
router.post("/upload/:subDomain/:localId", tokenAuthHandler, upload.single('file'), uploadMenuParser)

export default router
