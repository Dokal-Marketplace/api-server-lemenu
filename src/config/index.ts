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
  }
}
