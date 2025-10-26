# Menu Parser Integration with Inngest

This document explains how the menu parser functionality has been integrated with Inngest for background processing.

## Overview

The menu parser now supports both synchronous and asynchronous processing using Inngest for background job management. This allows for:

- **Background Processing**: Long-running OCR and parsing tasks don't block the API
- **Retry Logic**: Automatic retries for failed processing
- **Scalability**: Handle multiple menu processing requests concurrently
- **Monitoring**: Track job status and progress

## Architecture

### Services

1. **InngestService** (`src/services/inngestService.ts`)
   - Manages Inngest client and function definitions
   - Handles background job processing
   - Provides durable step functions

2. **MenuParserService** (`src/services/menuParserService.ts`)
   - AWS Textract integration
   - Menu parsing logic
   - OCR result processing

### Controllers

**MenuParserController** (`src/controllers/menuParserController.ts`)
- `uploadMenuParser`: Upload image and trigger background processing
- `processMenuFromUrl`: Process menu from URL
- `processMenuFromS3`: Process menu from S3
- `batchProcessMenus`: Batch process multiple menus
- `retryFailedMenu`: Retry failed processing
- `parseMenuDirect`: Synchronous processing for testing

## API Endpoints

### Upload and Process Menu
```
POST /api/v1/menu-parser/:subDomain/:localId
Content-Type: multipart/form-data
Body: image file
```

### Direct Processing (Synchronous)
```
POST /api/v1/menu-parser/direct/:subDomain/:localId
Content-Type: multipart/form-data
Body: image file
```

### Process from URL
```
POST /api/v1/menu-parser/process-url
Content-Type: application/json
Body: {
  "imageUrl": "https://example.com/menu.jpg",
  "menuId": "menu_123",
  "userId": "user_456",
  "restaurantId": "rest_789",
  "subDomain": "restaurant",
  "localId": "location_1"
}
```

### Process from S3
```
POST /api/v1/menu-parser/process-s3
Content-Type: application/json
Body: {
  "bucket": "my-bucket",
  "key": "menus/menu.jpg",
  "menuId": "menu_123",
  "userId": "user_456",
  "restaurantId": "rest_789",
  "subDomain": "restaurant",
  "localId": "location_1"
}
```

### Batch Processing
```
POST /api/v1/menu-parser/batch
Content-Type: application/json
Body: {
  "menus": [
    {
      "imageUrl": "https://example.com/menu1.jpg",
      "menuId": "menu_1",
      "userId": "user_456",
      "restaurantId": "rest_789"
    },
    {
      "imageUrl": "https://example.com/menu2.jpg",
      "menuId": "menu_2",
      "userId": "user_456",
      "restaurantId": "rest_789"
    }
  ],
  "batchId": "batch_123",
  "userId": "user_456"
}
```

### Retry Failed Processing
```
POST /api/v1/menu-parser/retry
Content-Type: application/json
Body: {
  "menuId": "menu_123",
  "originalError": "OCR confidence too low"
}
```

## Inngest Functions

### 1. Process Menu from URL
- **Event**: `menu/process.url`
- **Steps**:
  1. Fetch image from URL
  2. Perform OCR with AWS Textract
  3. Parse menu structure
  4. Save to database
  5. Send webhook notification
  6. Send email notification

### 2. Process Menu from S3
- **Event**: `menu/process.s3`
- **Steps**:
  1. Validate S3 access
  2. Perform OCR from S3
  3. Parse menu structure
  4. Save to database

### 3. Batch Process Menus
- **Event**: `menu/batch.process`
- **Steps**:
  1. Validate batch
  2. Trigger individual menu processing
  3. Save batch record

### 4. Retry Failed Menu
- **Event**: `menu/retry`
- **Steps**:
  1. Log retry attempt
  2. Fetch original data
  3. Re-trigger processing

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=lemenu-uploads

# AWS Textract Configuration
AWS_TEXTTRACT_MAX_RETRIES=3
AWS_TEXTTRACT_USE_ANALYZE=true

# Optional Webhook
WEBHOOK_URL=https://your-webhook-url.com/webhook
```

### Inngest Configuration

The Inngest endpoint is available at:
```
http://localhost:3001/api/inngest
```

For development, you can use the Inngest CLI:
```bash
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
```

## Usage Examples

### 1. Upload and Process Menu Image

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/v1/menu-parser/restaurant/location1', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Processing started:', result.data.runId);
```

### 2. Process Menu from URL

```javascript
const response = await fetch('/api/v1/menu-parser/process-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/menu.jpg',
    menuId: 'menu_123',
    userId: 'user_456',
    restaurantId: 'rest_789',
    subDomain: 'restaurant',
    localId: 'location_1'
  })
});
```

### 3. Direct Processing (Synchronous)

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/v1/menu-parser/direct/restaurant/location1', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Parsed menu:', result.data);
```

## Response Format

All endpoints return responses in the following format:

```json
{
  "type": "1",
  "message": "Success message",
  "data": {
    "menuId": "menu_123",
    "runId": "run_456",
    "status": "processing",
    "subDomain": "restaurant",
    "localId": "location_1",
    "restaurantName": "Restaurant Name",
    "sections": [...],
    "metadata": {...}
  }
}
```

## Error Handling

- **400 Bad Request**: Missing required fields
- **500 Internal Server Error**: Processing errors
- **Automatic Retries**: Failed jobs are automatically retried up to 3 times
- **Webhook Notifications**: Optional webhook notifications for completed processing

## Monitoring

- **Health Check**: `GET /health` - Check service status
- **Inngest Dashboard**: Use Inngest CLI for development monitoring
- **Logs**: All processing steps are logged with Winston

## Next Steps

1. **Database Integration**: Implement actual database saving
2. **Email Notifications**: Add email service integration
3. **Webhook Integration**: Implement webhook notifications
4. **Rate Limiting**: Add rate limiting for API endpoints
5. **Authentication**: Add proper user authentication
6. **Validation**: Add input validation middleware
