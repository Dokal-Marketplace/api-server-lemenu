import { Router } from "express"
import multer from "multer"
import { uploadMenu } from "../controllers/menuExcelController"

const router = Router()

// Configure multer for Excel file uploads (memory storage for MinIO)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for Excel files
  },
  fileFilter: (_req, file, cb) => {
    // Allow only Excel files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed'))
    }
  }
})

// POST /api/v1/menu-excel/upload/{subDomain}/{localId}
router.post("/upload/:subDomain/:localId", upload.single('file'), uploadMenu)

export default router
