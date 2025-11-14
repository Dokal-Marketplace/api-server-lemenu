import { Router } from "express";
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
  getBotOrders,
  resetBot
} from "../controllers/whatsappController";

const router = Router();

// Health check
router.get("/health", healthCheck);

// Bot Management
router.post("/bots", createBot);
router.get("/bots/:subDomain", getBotBySubDomain);
router.get("/bots/:botId", getBot);
router.post("/bots/:botId/start", startBot);
router.post("/bots/:botId/stop", stopBot);
router.get("/bots/:botId/status", getBotStatus);
router.get("/bots/:botId/qr", getQRCode);


router.post("/reset/:subDomain", resetBot);

// Messaging
router.post("/send-message", sendMessage);
router.post("/send-text", sendTextMessage);
router.post("/send-welcome", sendWelcomeMessage);

// Webhook (no auth required for WAHA)
router.post("/webhook", handleWebhook);

// Conversation Management
router.get("/conversations/:sessionId", getConversationState);
router.get("/bots/:botId/conversations", getActiveConversations);
router.put("/conversations/:sessionId/intent", updateConversationIntent);
router.delete("/conversations/:sessionId", endConversation);
router.get("/bots/:botId/statistics", getConversationStatistics);

// Order Management
router.post("/conversations/:sessionId/orders", createOrderFromConversation);
router.get("/conversations/:sessionId/order", getConversationOrder);
router.get("/bots/:botId/orders", getBotOrders);

export default router;