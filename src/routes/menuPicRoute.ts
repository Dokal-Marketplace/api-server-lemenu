import { Router } from "express"
import multer from "multer"
import { 
  getMenuImages, 
  uploadMenuImages, 
  updateMenuImages, 
  deleteMenuImage 
} from "../controllers/menuPicController"

const router = Router()

// Configure multer for file uploads (memory storage for MinIO)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
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

// GET /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
router.get("/", getMenuImages)

// POST /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
router.post("/", upload.array('files', 10), uploadMenuImages)

// POST /api/v1/menu-pic/update-images?subDomain={subDomain}&localId={localId}
router.post("/update-images", upload.array('files', 10), updateMenuImages)

// DELETE /api/v1/menu-pic?subDomain={subDomain}&localId={localId}&url={imageUrl}
router.delete("/", deleteMenuImage)

export default router
