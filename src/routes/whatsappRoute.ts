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
  healthCheck,
  getConversationState,
  getActiveConversations,
  updateConversationIntent,
  endConversation,
  getConversationStatistics,
  createOrderFromConversation,
  getConversationOrder,
  getBotOrders
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

// Conversation Management
router.get("/conversations/:sessionId", tokenAuthHandler, getConversationState);
router.get("/bots/:botId/conversations", tokenAuthHandler, getActiveConversations);
router.put("/conversations/:sessionId/intent", tokenAuthHandler, updateConversationIntent);
router.delete("/conversations/:sessionId", tokenAuthHandler, endConversation);
router.get("/bots/:botId/statistics", tokenAuthHandler, getConversationStatistics);

// Order Management
router.post("/conversations/:sessionId/orders", tokenAuthHandler, createOrderFromConversation);
router.get("/conversations/:sessionId/order", tokenAuthHandler, getConversationOrder);
router.get("/bots/:botId/orders", tokenAuthHandler, getBotOrders);

export default router;