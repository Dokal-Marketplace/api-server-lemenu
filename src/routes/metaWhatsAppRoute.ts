import { Router } from 'express';
import authenticate from '../middleware/auth';
import {
  sendTextMessage,
  sendTemplateMessage,
  sendInteractiveMessage,
  sendMediaMessage,
  markMessageAsRead,
  getTemplates,
  getPhoneNumbers,
  handleWebhook,
} from '../controllers/metaWhatsAppController';

const router = Router();

// All messaging endpoints require authentication
router.post('/send-message', authenticate, sendTextMessage);
router.post('/send-template', authenticate, sendTemplateMessage);
router.post('/send-interactive', authenticate, sendInteractiveMessage);
router.post('/send-media', authenticate, sendMediaMessage);

// Message management
router.post('/messages/:messageId/read', authenticate, markMessageAsRead);

// Information endpoints
router.get('/templates', authenticate, getTemplates);
router.get('/phone-numbers', authenticate, getPhoneNumbers);

// Webhook (no auth required - Meta will call this)
router.post('/webhook', handleWebhook);
router.get('/webhook', handleWebhook); // For webhook verification

export default router;

