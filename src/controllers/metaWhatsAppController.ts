/**
 * Meta WhatsApp Controller — barrel re-export
 *
 * This file re-exports all WhatsApp controller functions from focused,
 * domain-specific files. The route file imports from here, so no route
 * changes are needed.
 *
 * @see ./whatsapp/whatsappHelpers.ts           — shared validation & context helpers
 * @see ./whatsapp/whatsappMessagingController.ts — message sending (text, template, media, etc.)
 * @see ./whatsapp/whatsappAccountController.ts   — phone numbers, health, setup, account status
 * @see ./whatsapp/whatsappMigrationController.ts — WABA migration operations
 * @see ./whatsapp/whatsappTemplateController.ts  — template CRUD, provisioning, webhook subscriptions
 * @see ./whatsapp/whatsappWebhookController.ts   — webhook handler (single entry), OAuth, conversations
 */

// Helpers
export { sendErrorResponse } from './whatsapp/whatsappHelpers';

// Messaging
export {
  sendTextMessage,
  sendTemplateMessage,
  sendInteractiveMessage,
  sendProductMessage,
  sendProductListMessage,
  sendMediaMessage,
  markMessageAsRead,
} from './whatsapp/whatsappMessagingController';

// Account & phone number management
export {
  getTemplates,
  getPhoneNumbers,
  checkConversationWindow,
  checkHealth,
  validateSetup,
  getAccountStatus,
  getPhoneNumberDetails,
  checkTwoStepVerification,
  disableTwoStepVerification,
  verifyPhoneNumber,
} from './whatsapp/whatsappAccountController';

// Migration
export {
  validateMigration,
  executeMigration,
  getMigrationStatus,
  rollbackMigration,
} from './whatsapp/whatsappMigrationController';

// Template & webhook subscription management
export {
  getWebhookSubscriptions,
  subscribeWebhook,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  createTemplate,
  getTemplateStatus,
  deleteTemplate,
  getTemplateLibrary,
  getTemplateFromLibrary,
  provisionSelectedTemplates,
  provisionTemplates,
  checkTemplateStatuses,
} from './whatsapp/whatsappTemplateController';

// Webhook handler, OAuth, conversations
export {
  handleWebhook,
  exchangeToken,
  getConversations,
} from './whatsapp/whatsappWebhookController';
