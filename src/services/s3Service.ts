import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../config'
import logger from '../utils/logger'

class S3Service {
  private client: S3Client
  private bucketName: string
  private region: string

  constructor() {
    this.region = config.s3?.region || 'us-east-1'
    this.bucketName = config.s3?.bucketName || 'lemenu-uploads'
    
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.s3?.accessKeyId || '',
        secretAccessKey: config.s3?.secretAccessKey || ''
      },
      // VPC-optimized settings
      maxAttempts: 3,
    })
    
    this.initializeBucket()
  }

  private async initializeBucket() {
    const maxRetries = 3
    let retries = 0
    
    while (retries < maxRetries) {
      try {
        // Check if bucket exists
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
        logger.info(`S3 bucket exists: ${this.bucketName}`)
        return // Success, exit retry loop
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          logger.warn(`S3 bucket '${this.bucketName}' not found. Please create it manually in AWS Console.`)
          logger.warn('Bucket creation is not automated for S3 - you need to create it manually.')
          return
        }
        
        retries++
        logger.error(`Error checking S3 bucket (attempt ${retries}/${maxRetries}):`, error)
        
        if (retries >= maxRetries) {
          logger.error('Failed to check S3 bucket after all retries')
          throw error
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
      }
    }
  }

  private async ensureConnection(): Promise<void> {
    const maxRetries = 3
    let retries = 0
    
    while (retries < maxRetries) {
      try {
        // Test connection with a simple operation
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
        return // Connection successful
      } catch (error: any) {
        retries++
        logger.warn(`S3 connection lost (attempt ${retries}/${maxRetries}), attempting to reconnect...`, error)
        
        if (retries >= maxRetries) {
          logger.error('Failed to reconnect to S3 after all retries')
          throw new Error(`S3 connection failed after ${maxRetries} attempts: ${error.message}`)
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        
        // Reinitialize the client
        this.client = new S3Client({
          region: this.region,
          credentials: {
            accessKeyId: config.s3?.accessKeyId || '',
            secretAccessKey: config.s3?.secretAccessKey || ''
          },
          maxAttempts: 3,
        })
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    customName?: string
  ): Promise<{ url: string; key: string; size: number }> {
    try {
      // Ensure connection is alive
      await this.ensureConnection()
      
      const timestamp = Date.now()
      const randomSuffix = Math.round(Math.random() * 1E9)
      const fileExtension = file.originalname.split('.').pop()
      const fileName = customName || `${file.fieldname}-${timestamp}-${randomSuffix}.${fileExtension}`
      const objectName = `${folder}/${fileName}`

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectName,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'Original-Name': file.originalname
        }
      })

      await this.client.send(command)

      const url = `${config.s3?.publicUrl || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`}/${objectName}`
      
      logger.info(`File uploaded to S3: ${objectName}`)
      
      return {
        url,
        key: objectName,
        size: file.size
      }
    } catch (error) {
      logger.error('Error uploading file to S3:', error)
      throw error
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string
  ): Promise<Array<{ url: string; key: string; size: number }>> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder))
      const results = await Promise.all(uploadPromises)
      
      logger.info(`Uploaded ${results.length} files to S3 folder: ${folder}`)
      return results
    } catch (error) {
      logger.error('Error uploading multiple files to S3:', error)
      throw error
    }
  }

  async deleteFile(objectName: string): Promise<boolean> {
    try {
      await this.ensureConnection()
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectName
      })
      
      await this.client.send(command)
      logger.info(`File deleted from S3: ${objectName}`)
      return true
    } catch (error) {
      logger.error('Error deleting file from S3:', error)
      return false
    }
  }

  async getFileUrl(objectName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectName
      })
      
      const url = await getSignedUrl(this.client, command, { expiresIn: expiry })
      return url
    } catch (error) {
      logger.error('Error generating presigned URL:', error)
      throw error
    }
  }

  async listFiles(folder: string): Promise<string[]> {
    try {
      await this.ensureConnection()
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: folder
      })
      
      const response = await this.client.send(command)
      const files = response.Contents?.map(obj => obj.Key || '').filter(key => key) || []
      
      logger.info(`Listed ${files.length} files from S3 folder: ${folder}`)
      return files
    } catch (error) {
      logger.error('Error listing files from S3:', error)
      throw error
    }
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now()
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        details: {
          responseTime: `${responseTime}ms`,
          region: this.region,
          bucket: this.bucketName,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error('S3 health check failed:', error)
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          region: this.region,
          bucket: this.bucketName,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // Connection test method for debugging
  async testConnection(): Promise<{ success: boolean; details: any }> {
    try {
      logger.info('Testing S3 connection...')
      
      // Test basic connectivity
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
      
      // Test upload/download cycle
      const testObjectName = `connection-test-${Date.now()}.txt`
      const testContent = 'S3 connection test'
      
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: testObjectName,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain'
      })
      
      await this.client.send(putCommand)
      
      // Clean up test object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: testObjectName
      })
      
      await this.client.send(deleteCommand)
      
      logger.info('S3 connection test successful')
      
      return {
        success: true,
        details: {
          region: this.region,
          bucket: this.bucketName,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      logger.error('S3 connection test failed:', error)
      return {
        success: false,
        details: {
          error: error.message,
          region: this.region,
          bucket: this.bucketName,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

export default new S3Service()
