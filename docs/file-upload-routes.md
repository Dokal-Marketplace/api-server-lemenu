# File Upload Routes Implementation

This document describes the implemented file upload routes for the API server.

## Overview

The following file upload routes have been implemented:

1. **Menu Image Gallery Upload** (`/api/v1/menu-pic`)
2. **Excel Menu Upload** (`/api/v1/menu-excel/upload/{subDomain}/{localId}`)
3. **Menu Parser Image Upload** (`/api/v1/menu-parser/upload/{subDomain}/{localId}`)

## 1. Menu Image Gallery Upload Routes

### Base URL: `/api/v1/menu-pic`

#### GET - Check if images exist for the location
```http
GET /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "type": "1",
  "message": "Images retrieved successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "images": [],
    "hasImages": false
  }
}
```

#### POST - Upload new images
```http
POST /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- files: File[] (multiple image files, max 10)
```

**Response:**
```json
{
  "type": "1",
  "message": "Images uploaded successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "uploadedImages": [
      {
        "id": "string",
        "url": "string",
        "filename": "string",
        "originalName": "string",
        "size": "number",
        "mimetype": "string"
      }
    ],
    "totalUploaded": "number"
  }
}
```

#### POST - Update existing images
```http
POST /api/v1/menu-pic/update-images?subDomain={subDomain}&localId={localId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- files: File[] (multiple image files, max 10)
```

**Response:**
```json
{
  "type": "1",
  "message": "Images updated successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "updatedImages": [
      {
        "id": "string",
        "url": "string",
        "filename": "string",
        "originalName": "string",
        "size": "number",
        "mimetype": "string"
      }
    ],
    "totalUpdated": "number"
  }
}
```

#### DELETE - Delete specific image by URL
```http
DELETE /api/v1/menu-pic?subDomain={subDomain}&localId={localId}&url={imageUrl}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "type": "1",
  "message": "Image deleted successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "deletedUrl": "string",
    "deletedAt": "string"
  }
}
```

## 2. Excel Menu Upload Route

### Base URL: `/api/v1/menu-excel`

#### POST - Upload Excel menu file
```http
POST /api/v1/menu-excel/upload/{subDomain}/{localId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: File (Excel file: .xlsx, .xls, .csv)
```

**Response:**
```json
{
  "type": "1",
  "message": "Excel menu uploaded successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "filename": "string",
    "originalName": "string",
    "size": "number",
    "mimetype": "string",
    "uploadedAt": "string"
  }
}
```

## 3. Menu Parser Image Upload Route

### Base URL: `/api/v1/menu-parser`

#### POST - Upload menu parser image
```http
POST /api/v1/menu-parser/upload/{subDomain}/{localId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: File (Image file)
```

**Response:**
```json
{
  "type": "1",
  "message": "Menu parser image uploaded successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "filename": "string",
    "originalName": "string",
    "size": "number",
    "mimetype": "string",
    "uploadedAt": "string"
  }
}
```

## File Upload Configuration

### Multer Configuration
- **Menu Images**: 10MB limit, max 10 files, image files only
- **Excel Files**: 50MB limit, Excel/CSV files only (.xlsx, .xls, .csv)
- **Parser Images**: 20MB limit, image files only

### File Storage
Files are stored in the following directories:
- Menu images: `uploads/`
- Excel files: `uploads/excel/`
- Parser images: `uploads/parser/`

### Authentication
All routes require Bearer token authentication using the `tokenAuthHandler` middleware.

## Error Handling

All routes follow the standard API response format:
- `type: "1"` - Success
- `type: "3"` - Error
- `message` - Human readable message
- `data` - Response payload

Common error scenarios:
- Missing required parameters (subDomain, localId)
- No file uploaded
- Invalid file type
- File size exceeds limit
- Authentication failure

## Implementation Notes

- All file upload logic includes TODO comments for actual implementation
- File storage is currently configured for local disk storage
- Consider implementing cloud storage (AWS S3, Google Cloud Storage) for production
- Add proper file validation and virus scanning in production
- Implement proper error handling for file system operations
