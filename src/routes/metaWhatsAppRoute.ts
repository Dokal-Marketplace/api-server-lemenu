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
  checkHealth,
  validateSetup,
  validateMigration,
  executeMigration,
  getMigrationStatus,
  rollbackMigration,
  getAccountStatus,
  getPhoneNumberDetails,
  checkTwoStepVerification,
  disableTwoStepVerification,
  verifyPhoneNumber,
  getWebhookSubscriptions,
  subscribeWebhook,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  createTemplate,
  getTemplateStatus,
  deleteTemplate,
  provisionTemplates,
  checkTemplateStatuses,
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

// Template management endpoints
router.post('/templates', authenticate, createTemplate);
router.get('/templates/:templateName/status', authenticate, getTemplateStatus);
router.delete('/templates/:templateName', authenticate, deleteTemplate);
router.post('/templates/provision', authenticate, provisionTemplates);
router.get('/templates/statuses', authenticate, checkTemplateStatuses);

// Phone number management endpoints
router.get('/phone-numbers/:phoneNumberId', authenticate, getPhoneNumberDetails);
router.get('/phone-numbers/:phoneNumberId/two-step', authenticate, checkTwoStepVerification);
router.post('/phone-numbers/:phoneNumberId/two-step/disable', authenticate, disableTwoStepVerification);
router.post('/phone-numbers/:phoneNumberId/verify', authenticate, verifyPhoneNumber);

// Health and setup validation endpoints
router.get('/health', authenticate, checkHealth);
router.get('/setup/validate', authenticate, validateSetup);

// Account status endpoint
router.get('/account/status', authenticate, getAccountStatus);

// Migration endpoints
router.post('/migrate/validate', authenticate, validateMigration);
router.post('/migrate/execute', authenticate, executeMigration);
router.get('/migrate/status', authenticate, getMigrationStatus);
router.post('/migrate/rollback', authenticate, rollbackMigration);

// Webhook subscription management endpoints
router.get('/webhooks/subscriptions', authenticate, getWebhookSubscriptions);
router.post('/webhooks/subscribe', authenticate, subscribeWebhook);
router.put('/webhooks/subscriptions', authenticate, updateWebhookSubscription);
router.delete('/webhooks/subscriptions/:appId', authenticate, deleteWebhookSubscription);

// Webhook (no auth required - Meta will call this)
router.post('/webhook', handleWebhook);
router.get('/webhook', handleWebhook); // For webhook verification

export default router;

