import { Client } from 'minio'
import { config } from '../config'
import logger from '../utils/logger'

class MinIOService {
  private client: Client
  private bucketName: string

  constructor() {
    this.client = new Client({
      endPoint: config.minio?.endpoint || 'localhost',
      port: config.minio?.port || 9000,
      useSSL: config.minio?.useSSL || false,
      accessKey: config.minio?.accessKey || 'minioadmin',
      secretKey: config.minio?.secretKey || 'minioadmin'
    })
    this.bucketName = config.minio?.bucketName || 'lemenu-uploads'
    this.initializeBucket()
  }

  private async initializeBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucketName)
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1')
        logger.info(`Created MinIO bucket: ${this.bucketName}`)
      }
    } catch (error) {
      logger.error('Error initializing MinIO bucket:', error)
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    customName?: string
  ): Promise<{ url: string; key: string; size: number }> {
    try {
      const timestamp = Date.now()
      const randomSuffix = Math.round(Math.random() * 1E9)
      const fileExtension = file.originalname.split('.').pop()
      const fileName = customName || `${file.fieldname}-${timestamp}-${randomSuffix}.${fileExtension}`
      const objectName = `${folder}/${fileName}`

      await this.client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname
        }
      )

      const url = `${config.minio?.publicUrl || `http://localhost:9000`}/${this.bucketName}/${objectName}`
      
      logger.info(`File uploaded to MinIO: ${objectName}`)
      
      return {
        url,
        key: objectName,
        size: file.size
      }
    } catch (error) {
      logger.error('Error uploading file to MinIO:', error)
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
      
      logger.info(`Uploaded ${results.length} files to MinIO folder: ${folder}`)
      return results
    } catch (error) {
      logger.error('Error uploading multiple files to MinIO:', error)
      throw error
    }
  }

  async deleteFile(objectName: string): Promise<boolean> {
    try {
      await this.client.removeObject(this.bucketName, objectName)
      logger.info(`File deleted from MinIO: ${objectName}`)
      return true
    } catch (error) {
      logger.error('Error deleting file from MinIO:', error)
      return false
    }
  }

  async getFileUrl(objectName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(this.bucketName, objectName, expiry)
      return url
    } catch (error) {
      logger.error('Error generating presigned URL:', error)
      throw error
    }
  }

  async listFiles(folder: string): Promise<string[]> {
    try {
      const objectsList: string[] = []
      const objectsStream = this.client.listObjects(this.bucketName, folder, true)
      
      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          if (obj.name) {
            objectsList.push(obj.name)
          }
        })
        
        objectsStream.on('error', (err) => {
          logger.error('Error listing files from MinIO:', err)
          reject(err)
        })
        
        objectsStream.on('end', () => {
          resolve(objectsList)
        })
      })
    } catch (error) {
      logger.error('Error listing files from MinIO:', error)
      throw error
    }
  }
}

export default new MinIOService()
