import { Router } from "express"
import multer from "multer"
import { uploadMenu } from "../controllers/menuExcelController"

const router = Router()

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // TODO: Configure actual upload directory
    cb(null, 'uploads/excel/')
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'excel-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for Excel files
  },
  fileFilter: (req, file, cb) => {
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
