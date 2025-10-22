# MinIO Integration for File Uploads

This document describes the MinIO integration for file uploads in the API server.

## Overview

The API server now uses MinIO (S3-compatible object storage) for handling file uploads instead of local disk storage. This provides better scalability, reliability, and cloud-native file management.

## MinIO Setup

### Docker Compose Setup

Use the provided `docker-compose.minio.yml` file to set up MinIO:

```bash
docker-compose -f docker-compose.minio.yml up -d
```

This will start:
- MinIO server on port 9000 (API) and 9001 (Console)
- MinIO client for automatic bucket setup
- Public access policy for uploaded files

### Environment Variables

Add these environment variables to your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=lemenu-uploads
MINIO_PUBLIC_URL=http://localhost:9000
```

## File Storage Structure

Files are organized in the following structure in MinIO:

```
lemenu-uploads/
├── menu-images/
│   └── {subDomain}/
│       └── {localId}/
│           ├── files-{timestamp}-{random}.jpg
│           └── files-{timestamp}-{random}.png
├── excel-menus/
│   └── {subDomain}/
│       └── {localId}/
│           └── excel-{timestamp}-{random}.xlsx
└── parser-images/
    └── {subDomain}/
        └── {localId}/
            └── parser-{timestamp}-{random}.jpg
```

## API Endpoints with MinIO

### 1. Menu Image Gallery (`/api/v1/menu-pic`)

#### GET - List Images
```http
GET /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
```

**Response:**
```json
{
  "type": "1",
  "message": "Images retrieved successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "images": [
      {
        "key": "menu-images/subdomain/localid/files-1234567890-123456789.jpg",
        "url": "http://localhost:9000/lemenu-uploads/menu-images/subdomain/localid/files-1234567890-123456789.jpg"
      }
    ],
    "hasImages": true
  }
}
```

#### POST - Upload Images
```http
POST /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
Content-Type: multipart/form-data

FormData:
- files: File[] (multiple image files)
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
        "id": "img_1234567890_0",
        "url": "http://localhost:9000/lemenu-uploads/menu-images/subdomain/localid/files-1234567890-123456789.jpg",
        "key": "menu-images/subdomain/localid/files-1234567890-123456789.jpg",
        "filename": "image.jpg",
        "originalName": "image.jpg",
        "size": 1024000,
        "mimetype": "image/jpeg"
      }
    ],
    "totalUploaded": 1
  }
}
```

#### DELETE - Delete Image
```http
DELETE /api/v1/menu-pic?subDomain={subDomain}&localId={localId}&url={imageUrl}
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
    "deletedKey": "menu-images/subdomain/localid/files-1234567890-123456789.jpg",
    "deletedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Excel Menu Upload (`/api/v1/menu-excel/upload/{subDomain}/{localId}`)

```http
POST /api/v1/menu-excel/upload/{subDomain}/{localId}
Content-Type: multipart/form-data

FormData:
- file: File (Excel file)
```

**Response:**
```json
{
  "type": "1",
  "message": "Excel menu uploaded successfully",
  "data": {
    "subDomain": "string",
    "localId": "string",
    "filename": "excel-menus/subdomain/localid/excel-1234567890-123456789.xlsx",
    "originalName": "menu.xlsx",
    "size": 2048000,
    "mimetype": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "url": "http://localhost:9000/lemenu-uploads/excel-menus/subdomain/localid/excel-1234567890-123456789.xlsx",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Menu Parser Image Upload (`/api/v1/menu-parser/upload/{subDomain}/{localId}`)

```http
POST /api/v1/menu-parser/upload/{subDomain}/{localId}
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
    "filename": "parser-images/subdomain/localid/parser-1234567890-123456789.jpg",
    "originalName": "menu-image.jpg",
    "size": 1536000,
    "mimetype": "image/jpeg",
    "url": "http://localhost:9000/lemenu-uploads/parser-images/subdomain/localid/parser-1234567890-123456789.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## MinIO Service Features

The `MinIOService` class provides:

- **Automatic bucket creation** on startup
- **File upload** with custom naming and metadata
- **Multiple file upload** support
- **File deletion** by object key
- **Presigned URL generation** for secure access
- **File listing** by folder prefix
- **Error handling** and logging

## File Upload Configuration

### Multer Configuration
- **Storage**: Memory storage (files are processed in memory before uploading to MinIO)
- **File Size Limits**:
  - Menu images: 10MB per file, max 10 files
  - Excel files: 50MB per file
  - Parser images: 20MB per file
- **File Type Validation**: Automatic validation based on MIME types

### MinIO Configuration
- **Bucket**: `lemenu-uploads` (configurable)
- **Public Access**: Enabled for uploaded files
- **Folder Structure**: Organized by type and location
- **File Naming**: Timestamped with random suffixes to prevent conflicts

## Production Considerations

### Security
- Change default MinIO credentials
- Use SSL/TLS in production
- Implement proper access policies
- Consider using presigned URLs for sensitive files

### Performance
- Configure MinIO with appropriate resources
- Use CDN for public file access
- Implement file compression
- Consider file cleanup policies

### Monitoring
- Monitor MinIO server health
- Track storage usage
- Log file operations
- Set up alerts for failures

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if MinIO is running and accessible
2. **Bucket Not Found**: Ensure bucket creation is working
3. **Permission Denied**: Check MinIO access policies
4. **File Not Found**: Verify file paths and bucket structure

### Debug Commands

```bash
# Check MinIO status
docker-compose -f docker-compose.minio.yml ps

# View MinIO logs
docker-compose -f docker-compose.minio.yml logs minio

# Access MinIO console
open http://localhost:9001
```

## Migration from Local Storage

If migrating from local disk storage:

1. Export existing files from local storage
2. Upload files to MinIO using the new endpoints
3. Update any hardcoded file paths in your application
4. Test file access and deletion operations
5. Remove local storage directories

## Next Steps

- Implement file metadata storage in database
- Add file versioning support
- Implement file cleanup policies
- Add file processing pipelines
- Integrate with CDN for better performance
