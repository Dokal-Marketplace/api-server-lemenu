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
  minio: {
    endpoint: getEnvVar("MINIO_ENDPOINT", "localhost"),
    port: parseInt(getEnvVar("MINIO_PORT", "9000")),
    useSSL: getEnvVar("MINIO_USE_SSL", "false") === "true",
    accessKey: getEnvVar("MINIO_ACCESS_KEY", "minioadmin"),
    secretKey: getEnvVar("MINIO_SECRET_KEY", "minioadmin"),
    bucketName: getEnvVar("MINIO_BUCKET_NAME", "lemenu-uploads"),
    publicUrl: getEnvVar("MINIO_PUBLIC_URL", "http://localhost:9000")
  }
}
