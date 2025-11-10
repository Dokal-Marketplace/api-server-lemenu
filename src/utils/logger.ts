import winston from "winston"
import { config } from "../config"

export const LOGS_FILE_PATH = "logs/server.log"

const { combine, timestamp, printf, json, errors } = winston.format

// Define the log format for development and production
// Handles both string messages and object metadata
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
  
  // If there's metadata (and it's not just empty object), append it
  const metaKeys = Object.keys(metadata).filter(key => 
    key !== 'splat' && key !== 'Symbol(level)' && key !== 'Symbol(message)'
  )
  
  if (metaKeys.length > 0) {
    const metaObj: any = {}
    metaKeys.forEach(key => {
      metaObj[key] = metadata[key]
    })
    if (Object.keys(metaObj).length > 0) {
      logMessage += ` ${JSON.stringify(metaObj)}`
    }
  }
  
  return logMessage
})

// Configure the logger
const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug", // No debug logs shown in production
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        timestamp(),
        errors({ stack: true }),
        config.nodeEnv === "production" ? json() : logFormat
      ),
    }),

    // Optionally, you can log to a file for persistent storage
    new winston.transports.File({ 
      filename: LOGS_FILE_PATH,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json() // Always use JSON in file for better parsing
      )
    }),
  ],
})

export default logger
