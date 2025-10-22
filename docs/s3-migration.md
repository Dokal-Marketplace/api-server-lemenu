# S3 Migration Guide

This document describes the migration from MinIO to AWS S3 for file storage in the API server.

## Overview

The API server has been migrated from MinIO to AWS S3 to resolve VPC connection issues and provide better reliability, scalability, and global availability.

## Changes Made

### 1. New S3 Service (`src/services/s3Service.ts`)

- Replaced MinIO client with AWS S3 SDK
- Added VPC-optimized connection settings
- Implemented health checks and connection testing
- Added proper error handling and retry logic

### 2. Updated Configuration (`src/config/index.ts`)

Added S3 configuration with environment variables:
- `AWS_REGION`: AWS region for S3 bucket
- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `S3_BUCKET_NAME`: S3 bucket name
- `S3_PUBLIC_URL`: Optional custom public URL for S3

### 3. Updated Controllers

All file upload controllers have been updated to use S3:
- `src/controllers/menuPicController.ts`
- `src/controllers/menuParserController.ts`
- `src/controllers/menuExcelController.ts`
- `src/controllers/healthController.ts`

### 4. Updated Health Endpoints

- `/api/v1/health/s3` - S3 health check
- `/api/v1/health/s3/test` - S3 connection test

## Environment Variables

Add these environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=lemenu-uploads
S3_PUBLIC_URL=https://your-bucket-name.s3.us-east-1.amazonaws.com
```

## AWS Setup Requirements

### 1. Create S3 Bucket

1. Go to AWS S3 in AWS Console
2. Create a new bucket with the name specified in `S3_BUCKET_NAME`
3. Configure bucket permissions for public read access if needed

### 2. Create IAM User

1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following policy (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

### 3. Configure Bucket CORS (if needed)

If you need to access files from a web browser, configure CORS:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## File Structure in S3

Files are organized in the same structure as before:

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

## API Endpoints

All existing API endpoints remain the same:

### Menu Images
- `GET /api/v1/menu-pic` - List images
- `POST /api/v1/menu-pic` - Upload images
- `DELETE /api/v1/menu-pic` - Delete image

### Excel Menus
- `POST /api/v1/menu-excel/upload/{subDomain}/{localId}` - Upload Excel menu

### Menu Parser
- `POST /api/v1/menu-parser/upload/{subDomain}/{localId}` - Upload parser image

### Health Checks
- `GET /api/v1/health/s3` - S3 health status
- `GET /api/v1/health/s3/test` - S3 connection test

## Migration Steps

1. **Install Dependencies**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Set Environment Variables**
   - Add AWS credentials to your `.env` file
   - Configure S3 bucket name and region

3. **Create S3 Bucket**
   - Create the bucket in AWS Console
   - Configure appropriate permissions

4. **Test Connection**
   ```bash
   curl http://localhost:3001/api/v1/health/s3/test
   ```

5. **Migrate Existing Files (Optional)**
   - If you have existing files in MinIO, you'll need to migrate them to S3
   - This can be done using AWS CLI or a custom migration script

## Benefits of S3 Migration

1. **No VPC Issues**: S3 is a managed service with global availability
2. **Better Reliability**: 99.999999999% (11 9's) durability
3. **Scalability**: Automatically scales with your needs
4. **Global CDN**: Can be integrated with CloudFront for better performance
5. **Cost Effective**: Pay only for what you use
6. **Security**: Built-in encryption and access controls

## Troubleshooting

### Common Issues

1. **Access Denied**: Check IAM permissions and bucket policies
2. **Bucket Not Found**: Ensure bucket exists and is in the correct region
3. **Invalid Credentials**: Verify AWS access keys are correct
4. **CORS Issues**: Configure bucket CORS policy if accessing from browser

### Debug Commands

```bash
# Test S3 health
curl http://localhost:3001/api/v1/health/s3

# Test S3 connection
curl http://localhost:3001/api/v1/health/s3/test

# Check AWS credentials
aws s3 ls s3://your-bucket-name
```

## Rollback Plan

If you need to rollback to MinIO:

1. Revert controller changes
2. Update environment variables to use MinIO
3. Restart the application
4. Ensure MinIO is running and accessible

The MinIO service code is still available in `src/services/minioService.ts` for rollback purposes.
