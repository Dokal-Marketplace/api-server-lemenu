import { getEnvVar } from "./env"

export type NodeEnvOptions = "production" | "development"

export type Config = {
  nodeEnv: NodeEnvOptions
  port: string
  healthSecret: string
  logSecret: string
  waha: {
    baseUrl: string
    apiKey: string
    webhookUrl: string
  }
  minio?: {
    endpoint: string
    port: number
    useSSL: boolean
    accessKey: string
    secretKey: string
    bucketName: string
    publicUrl: string
  }
  aws?: {
    region: string
    
    s3?: {
      region: string
      credentials: {
        accessKeyId: string
        secretAccessKey: string
      }
      bucketName: string
      publicUrl?: string
    }
    textract?: {
      region: string
      credentials: {
        accessKeyId: string
        secretAccessKey: string
      }
      maxRetries?: number;
      useAnalyze?: boolean; 
    }
  }
}

// Export configurations
export const config: Config = {
  nodeEnv: getEnvVar("NODE_ENV", "development") as NodeEnvOptions,
  port: getEnvVar("PORT", "3001"),
  healthSecret: getEnvVar("HEALTH_SECRET"),
  logSecret: getEnvVar("LOGS_SECRET"),
  waha: {
    baseUrl: getEnvVar("WAHA_BASE_URL", "http://localhost:3000"),
    apiKey: getEnvVar("WAHA_API_KEY"),
    webhookUrl: getEnvVar("WAHA_WEBHOOK_URL", "http://localhost:3001/api/v1/whatsapp/webhook")
  },
  aws: {
    region: getEnvVar("AWS_REGION", "us-east-1"),
    s3: {
      region: getEnvVar("AWS_REGION", "us-east-1"),
      credentials: {
        accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID", ""),
        secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY", ""),
      },
      bucketName: getEnvVar("AWS_S3_BUCKET_NAME", "cartamenu-ai"),
      publicUrl: getEnvVar("AWS_S3_PUBLIC_URL", "")
    },
    textract: {
      region: getEnvVar("AWS_REGION", "eu-central-1"),
      credentials: {
        accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID", ""),
        secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY", ""),
      },
      maxRetries: parseInt(getEnvVar("AWS_TEXTRACT_MAX_RETRIES", "3")),
      useAnalyze: getEnvVar("AWS_TEXTRACT_USE_ANALYZE", "true") === "true"
    }
  }
}
