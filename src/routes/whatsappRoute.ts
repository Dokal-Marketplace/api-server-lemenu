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
  getBotOrders,
  getComplianceStats,
  checkSpamContent,
  getMessageVariations,
  cleanupComplianceData,
  // Interactive Messages
  sendButtons,
  sendList,
  // Media Messages
  sendImage,
  sendVideo,
  sendDocument,
  sendVoice,
  // Location and Contact Messages
  sendLocation,
  sendContact,
  // Template Messages
  sendTemplate,
  // Poll Messages
  sendPoll,
  // Link Preview
  sendLinkPreview
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

// Interactive Messages
router.post("/send-buttons", tokenAuthHandler, sendButtons);
router.post("/send-list", tokenAuthHandler, sendList);

// Media Messages
router.post("/send-image", tokenAuthHandler, sendImage);
router.post("/send-video", tokenAuthHandler, sendVideo);
router.post("/send-document", tokenAuthHandler, sendDocument);
router.post("/send-voice", tokenAuthHandler, sendVoice);

// Location and Contact Messages
router.post("/send-location", tokenAuthHandler, sendLocation);
router.post("/send-contact", tokenAuthHandler, sendContact);

// Template Messages
router.post("/send-template", tokenAuthHandler, sendTemplate);

// Poll Messages
router.post("/send-poll", tokenAuthHandler, sendPoll);

// Link Preview
router.post("/send-link-preview", tokenAuthHandler, sendLinkPreview);

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

// Compliance and Monitoring
router.get("/compliance/stats", tokenAuthHandler, getComplianceStats);
router.post("/compliance/check-spam", tokenAuthHandler, checkSpamContent);
router.post("/compliance/message-variations", tokenAuthHandler, getMessageVariations);
router.post("/compliance/cleanup", tokenAuthHandler, cleanupComplianceData);

export default router;