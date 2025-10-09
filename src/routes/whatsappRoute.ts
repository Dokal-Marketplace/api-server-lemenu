import { Router } from "express";
import { tokenAuthHandler } from "../middleware/tokenAuthHandler";
import {
  createBot,
  getBot,
  getBotBySubDomain,
  startBot,
  stopBot,
  getBotStatus,
  getQRCode,
  sendMessage,
  sendTextMessage,
  sendWelcomeMessage,
  handleWebhook,
  healthCheck
} from "../controllers/whatsappController";

const router = Router();

// Health check
router.get("/health", healthCheck);

// Bot Management
router.post("/bots", tokenAuthHandler, createBot);
router.get("/bots/:botId", tokenAuthHandler, getBot);
router.get("/bots/subdomain/:subDomain", tokenAuthHandler, getBotBySubDomain);
router.post("/bots/:botId/start", tokenAuthHandler, startBot);
router.post("/bots/:botId/stop", tokenAuthHandler, stopBot);
router.get("/bots/:botId/status", tokenAuthHandler, getBotStatus);
router.get("/bots/:botId/qr", tokenAuthHandler, getQRCode);

// Messaging
router.post("/send-message", tokenAuthHandler, sendMessage);
router.post("/send-text", tokenAuthHandler, sendTextMessage);
router.post("/send-welcome", tokenAuthHandler, sendWelcomeMessage);

// Webhook (no auth required for WAHA)
router.post("/webhook", handleWebhook);

export default router;