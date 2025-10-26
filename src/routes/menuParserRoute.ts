import { Router } from "express"
import multer from "multer"
import { 
  uploadMenuParser, 
  processMenuFromUrl, 
  processMenuFromS3, 
  batchProcessMenus, 
  retryFailedMenu,
  parseMenuDirect 
} from "../controllers/menuParserController"

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
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

// POST /api/v1/menu-parser/:subDomain/:localId - Upload and process menu image
router.post('/:subDomain/:localId', upload.single('image'), uploadMenuParser)

// POST /api/v1/menu-parser/direct/:subDomain/:localId - Direct parsing (synchronous)
router.post('/direct/:subDomain/:localId', upload.single('image'), parseMenuDirect)

// POST /api/v1/menu-parser/process-url - Process menu from URL
router.post('/process-url', processMenuFromUrl)

// POST /api/v1/menu-parser/process-s3 - Process menu from S3
router.post('/process-s3', processMenuFromS3)

// POST /api/v1/menu-parser/batch - Batch process multiple menus
router.post('/batch', batchProcessMenus)

// POST /api/v1/menu-parser/retry - Retry failed menu processing
router.post('/retry', retryFailedMenu)

export default router