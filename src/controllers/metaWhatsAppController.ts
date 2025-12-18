import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { MetaWhatsAppService } from '../services/whatsapp/metaWhatsAppService';
import { Business } from '../models/Business';
import { WhatsAppAPIError, createValidationError, createServerError } from '../utils/whatsappErrors';
import { getTemplateById } from '../utils/templates';

/**
 * Validation helpers
 */
const validatePhoneNumber = (phone: string): boolean => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

const validateTemplateName = (name: string): boolean => {
  return /^[a-z0-9_]{1,512}$/i.test(name);
};

/**
 * Standardized error response helper
 * Available for direct error responses when not using Express error handlers
 */
export const sendErrorResponse = (res: Response, statusCode: number, message: string, data?: any) => {
  res.status(statusCode).json({
    type: statusCode >= 500 ? '3' : '3',
    message,
    data: data || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Extract business context from request
 * Supports query params (subDomain, localId) or from authenticated user
 */
const getBusinessContext = (req: Request): { subDomain: string; localId?: string } => {
  // Priority 1: Query parameters
  if (req.query.subDomain) {
    return {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string | undefined,
    };
  }

  // Priority 2: Request body
  if (req.body.subDomain) {
    return {
      subDomain: req.body.subDomain,
      localId: req.body.localId,
    };
  }

  // Priority 3: From authenticated user's business (if available)
  const user = (req as any).user;
  if (user && user.business) {
    return {
      subDomain: user.business.subDomain,
      localId: user.business.localId,
    };
  }

  throw new WhatsAppAPIError('Business context (subDomain) is required', 400, '3', null);
};

/**
 * Send a text message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-message
 */
export const sendTextMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, text, previewUrl } = req.body;

    if (!to || !text) {
      return next(createValidationError('Missing required fields: to, text'));
    }

    if (!validatePhoneNumber(to)) {
      return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
    }

    const result = await MetaWhatsAppService.sendTextMessage(
      subDomain,
      { to, text, previewUrl },
      localId
    );

    res.json({
      type: '1',
      message: 'Message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending text message:', error);
    next(createServerError(error.message || 'Failed to send message', error));
  }
};

/**
 * Send a template message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-template
 */
export const sendTemplateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, templateName, languageCode, parameters } = req.body;

    if (!to || !templateName) {
      return next(createValidationError('Missing required fields: to, templateName'));
    }

    if (!validatePhoneNumber(to)) {
      return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
    }

    if (!validateTemplateName(templateName)) {
      return next(createValidationError('Template name must be alphanumeric with underscores, max 512 characters'));
    }

    const result = await MetaWhatsAppService.sendTemplateMessage(
      subDomain,
      { to, templateName, languageCode, parameters },
      localId
    );

    res.json({
      type: '1',
      message: 'Template message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending template message:', error);
    next(createServerError(error.message || 'Failed to send template message', error));
  }
};

/**
 * Send an interactive message (buttons or list) via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-interactive
 */
export const sendInteractiveMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, type, body, footer, header, action } = req.body;

    if (!to || !type || !body || !action) {
      return next(createValidationError('Missing required fields: to, type, body, action'));
    }

    if (type !== 'button' && type !== 'list') {
      return next(createValidationError('Type must be either "button" or "list"'));
    }

    const result = await MetaWhatsAppService.sendInteractiveMessage(
      subDomain,
      { to, type, body, footer, header, action },
      localId
    );

    res.json({
      type: '1',
      message: 'Interactive message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending interactive message:', error);
    next(createServerError(error.message || 'Failed to send interactive message', error));
  }
};

/**
 * Send a product message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-product
 */
export const sendProductMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, catalogId, productRetailerId, body, footer, header } = req.body;

    if (!to || !catalogId || !productRetailerId) {
      return next(createValidationError('Missing required fields: to, catalogId, productRetailerId'));
    }

    if (!validatePhoneNumber(to)) {
      return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
    }

    const result = await MetaWhatsAppService.sendProductMessage(
      subDomain,
      { to, catalogId, productRetailerId, body, footer, header },
      localId
    );

    res.json({
      type: '1',
      message: 'Product message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending product message:', error);
    next(createServerError(error.message || 'Failed to send product message', error));
  }
};

/**
 * Send a product list message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-product-list
 */
export const sendProductListMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, catalogId, sections, body, footer, header } = req.body;

    if (!to || !catalogId || !sections) {
      return next(createValidationError('Missing required fields: to, catalogId, sections'));
    }

    if (!validatePhoneNumber(to)) {
      return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return next(createValidationError('Sections must be a non-empty array'));
    }

    // Validate sections structure
    for (const section of sections) {
      if (!section.title || !section.productItems || !Array.isArray(section.productItems)) {
        return next(createValidationError('Each section must have a title and productItems array'));
      }
      if (section.productItems.length === 0) {
        return next(createValidationError('Each section must have at least one product item'));
      }
      for (const item of section.productItems) {
        if (!item.productRetailerId) {
          return next(createValidationError('Each product item must have a productRetailerId'));
        }
      }
    }

    const result = await MetaWhatsAppService.sendProductListMessage(
      subDomain,
      { to, catalogId, sections, body, footer, header },
      localId
    );

    res.json({
      type: '1',
      message: 'Product list message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending product list message:', error);
    next(createServerError(error.message || 'Failed to send product list message', error));
  }
};

/**
 * Send a media message via Meta WhatsApp Business API
 * POST /api/v1/whatsapp/send-media
 */
export const sendMediaMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { to, type, mediaId, mediaUrl, caption, filename } = req.body;

    if (!to || !type) {
      return next(createValidationError('Missing required fields: to, type'));
    }

    if (!mediaId && !mediaUrl) {
      return next(createValidationError('Either mediaId or mediaUrl must be provided'));
    }

    const validTypes = ['image', 'audio', 'video', 'document'];
    if (!validTypes.includes(type)) {
      return next(createValidationError(`Type must be one of: ${validTypes.join(', ')}`));
    }

    const result = await MetaWhatsAppService.sendMediaMessage(
      subDomain,
      { to, type, mediaId, mediaUrl, caption, filename },
      localId
    );

    res.json({
      type: '1',
      message: 'Media message sent successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error sending media message:', error);
    next(createServerError(error.message || 'Failed to send media message', error));
  }
};

/**
 * Mark a message as read
 * POST /api/v1/whatsapp/messages/:messageId/read
 */
export const markMessageAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { messageId } = req.params;

    if (!messageId) {
      return next(createValidationError('Missing messageId parameter'));
    }

    const result = await MetaWhatsAppService.markMessageAsRead(
      subDomain,
      messageId,
      localId
    );

    res.json({
      type: '1',
      message: 'Message marked as read',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error marking message as read:', error);
    next(createServerError(error.message || 'Failed to mark message as read', error));
  }
};

/**
 * Get message templates
 * GET /api/v1/whatsapp/templates
 */
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.getTemplates(subDomain, localId);

    res.json({
      type: '1',
      message: 'Templates retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting templates:', error);
    next(createServerError(error.message || 'Failed to get templates', error));
  }
};

/**
 * Get phone numbers
 * GET /api/v1/whatsapp/phone-numbers
 */
export const getPhoneNumbers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.getPhoneNumbers(subDomain, localId);

    res.json({
      type: '1',
      message: 'Phone numbers retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting phone numbers:', error);
    next(createServerError(error.message || 'Failed to get phone numbers', error));
  }
};

/**
 * Check conversation window status
 * GET /api/v1/whatsapp/conversations/:phone/window
 */
export const checkConversationWindow = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { phone } = req.params;

    if (!phone) {
      return next(createValidationError('Missing phone parameter'));
    }

    if (!validatePhoneNumber(phone)) {
      return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
    }

    const result = await MetaWhatsAppService.checkConversationWindow(
      subDomain,
      phone,
      localId
    );

    // Format response with human-readable time remaining
    const responseData: any = {
      isOpen: result.isOpen,
      lastMessageTime: result.lastMessageTime ? result.lastMessageTime.toISOString() : undefined,
    };

    if (result.isOpen && result.expiresAt && result.timeRemaining) {
      responseData.expiresAt = result.expiresAt.toISOString();
      responseData.timeRemaining = {
        milliseconds: result.timeRemaining,
        seconds: Math.floor(result.timeRemaining / 1000),
        minutes: Math.floor(result.timeRemaining / (1000 * 60)),
        hours: Math.floor(result.timeRemaining / (1000 * 60 * 60)),
        humanReadable: formatTimeRemaining(result.timeRemaining),
      };
    }

    res.json({
      type: '1',
      message: result.isOpen
        ? 'Conversation window is open'
        : 'Conversation window is closed',
      data: responseData,
    });
  } catch (error: any) {
    logger.error('Error checking conversation window:', error);
    next(createServerError(error.message || 'Failed to check conversation window', error));
  }
};

/**
 * Format time remaining in human-readable format
 */
const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Check WhatsApp health status
 * GET /api/v1/whatsapp/health
 */
export const checkHealth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.checkHealth(subDomain, localId);

    if (result.isHealthy) {
      res.json({
        type: '1',
        message: 'WhatsApp is healthy and operational',
        data: result,
      });
    } else {
      res.status(503).json({
        type: '3',
        message: result.reason || 'WhatsApp is not healthy',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error checking WhatsApp health:', error);
    next(createServerError(error.message || 'Failed to check WhatsApp health', error));
  }
};

/**
 * Validate WhatsApp setup
 * GET /api/v1/whatsapp/setup/validate
 */
export const validateSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.validateSetup(subDomain, localId);

    if (result.isValid) {
      res.json({
        type: '1',
        message: 'WhatsApp setup is valid',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: 'WhatsApp setup validation failed',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error validating WhatsApp setup:', error);
    next(createServerError(error.message || 'Failed to validate WhatsApp setup', error));
  }
};

/**
 * Validate migration data
 * POST /api/v1/whatsapp/migrate/validate
 */
export const validateMigration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { newWabaId, newPhoneNumberIds, newAccessToken } = req.body;

    if (!newWabaId || !newPhoneNumberIds || !newAccessToken) {
      return next(createValidationError('Missing required fields: newWabaId, newPhoneNumberIds, newAccessToken'));
    }

    if (!Array.isArray(newPhoneNumberIds) || newPhoneNumberIds.length === 0) {
      return next(createValidationError('newPhoneNumberIds must be a non-empty array'));
    }

    const result = await MetaWhatsAppService.validateMigration(
      subDomain,
      newWabaId,
      newPhoneNumberIds,
      newAccessToken,
      localId
    );

    if (result.isValid) {
      res.json({
        type: '1',
        message: 'Migration validation passed',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: 'Migration validation failed',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error validating migration:', error);
    next(createServerError(error.message || 'Failed to validate migration', error));
  }
};

/**
 * Execute migration
 * POST /api/v1/whatsapp/migrate/execute
 */
export const executeMigration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { newWabaId, newPhoneNumberIds, newAccessToken, newTokenExpiresAt, migratedBy } = req.body;

    if (!newWabaId || !newPhoneNumberIds || !newAccessToken) {
      return next(createValidationError('Missing required fields: newWabaId, newPhoneNumberIds, newAccessToken'));
    }

    if (!Array.isArray(newPhoneNumberIds) || newPhoneNumberIds.length === 0) {
      return next(createValidationError('newPhoneNumberIds must be a non-empty array'));
    }

    const migrationData = {
      newWabaId,
      newPhoneNumberIds,
      newAccessToken,
      newTokenExpiresAt: newTokenExpiresAt ? new Date(newTokenExpiresAt) : undefined,
      migratedBy: migratedBy || (req as any).user?.id,
    };

    const result = await MetaWhatsAppService.executeMigration(
      subDomain,
      migrationData,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Migration executed successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Migration execution failed',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error executing migration:', error);
    next(createServerError(error.message || 'Failed to execute migration', error));
  }
};

/**
 * Get migration status
 * GET /api/v1/whatsapp/migrate/status
 */
export const getMigrationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.getMigrationStatus(subDomain, localId);

    res.json({
      type: '1',
      message: 'Migration status retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting migration status:', error);
    next(createServerError(error.message || 'Failed to get migration status', error));
  }
};

/**
 * Rollback migration
 * POST /api/v1/whatsapp/migrate/rollback
 */
export const rollbackMigration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { migrationId } = req.body;

    if (!migrationId) {
      return next(createValidationError('Missing required field: migrationId'));
    }

    const result = await MetaWhatsAppService.rollbackMigration(
      subDomain,
      migrationId,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Migration rolled back successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Migration rollback failed',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error rolling back migration:', error);
    next(createServerError(error.message || 'Failed to rollback migration', error));
  }
};

/**
 * Get account status
 * GET /api/v1/whatsapp/account/status
 */
export const getAccountStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.getAccountStatus(subDomain, localId);

    res.json({
      type: '1',
      message: 'Account status retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting account status:', error);
    next(createServerError(error.message || 'Failed to get account status', error));
  }
};

/**
 * Get phone number details
 * GET /api/v1/whatsapp/phone-numbers/:phoneNumberId
 */
export const getPhoneNumberDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { phoneNumberId } = req.params;

    if (!phoneNumberId) {
      return next(createValidationError('Missing phoneNumberId parameter'));
    }

    const result = await MetaWhatsAppService.getPhoneNumberDetails(
      phoneNumberId,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Phone number details retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting phone number details:', error);
    next(createServerError(error.message || 'Failed to get phone number details', error));
  }
};

/**
 * Check two-step verification status
 * GET /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step
 */
export const checkTwoStepVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { phoneNumberId } = req.params;

    if (!phoneNumberId) {
      return next(createValidationError('Missing phoneNumberId parameter'));
    }

    const result = await MetaWhatsAppService.checkTwoStepVerification(
      phoneNumberId,
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Two-step verification status retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error checking two-step verification:', error);
    next(createServerError(error.message || 'Failed to check two-step verification', error));
  }
};

/**
 * Disable two-step verification
 * POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step/disable
 */
export const disableTwoStepVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { phoneNumberId } = req.params;

    if (!phoneNumberId) {
      return next(createValidationError('Missing phoneNumberId parameter'));
    }

    const result = await MetaWhatsAppService.disableTwoStepVerification(
      phoneNumberId,
      subDomain,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Two-step verification disabled successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to disable two-step verification',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error disabling two-step verification:', error);
    next(createServerError(error.message || 'Failed to disable two-step verification', error));
  }
};

/**
 * Verify phone number
 * POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/verify
 */
export const verifyPhoneNumber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { phoneNumberId } = req.params;
    const { method } = req.body;

    if (!phoneNumberId) {
      return next(createValidationError('Missing phoneNumberId parameter'));
    }

    if (!method || (method !== 'SMS' && method !== 'VOICE')) {
      return next(createValidationError('Method must be either SMS or VOICE'));
    }

    const result = await MetaWhatsAppService.verifyPhoneNumber(
      phoneNumberId,
      method,
      subDomain,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Verification code requested successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to request verification code',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error verifying phone number:', error);
    next(createServerError(error.message || 'Failed to verify phone number', error));
  }
};

/**
 * Get webhook subscriptions
 * GET /api/v1/whatsapp/webhooks/subscriptions
 */
export const getWebhookSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const result = await MetaWhatsAppService.getWebhookSubscriptions(subDomain, localId);

    res.json({
      type: '1',
      message: 'Webhook subscriptions retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting webhook subscriptions:', error);
    next(createServerError(error.message || 'Failed to get webhook subscriptions', error));
  }
};

/**
 * Subscribe to webhooks
 * POST /api/v1/whatsapp/webhooks/subscribe
 */
export const subscribeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { webhookUrl, verifyToken, fields } = req.body;

    // Strict validation: Required fields
    if (!webhookUrl || !verifyToken || !fields) {
      return next(createValidationError('Missing required fields: webhookUrl, verifyToken, fields'));
    }

    // Strict validation: Fields must be a non-empty array
    if (!Array.isArray(fields)) {
      return next(createValidationError('Fields must be an array'));
    }

    if (fields.length === 0) {
      return next(createValidationError(
        'Fields array cannot be empty. You must subscribe to at least one webhook field. ' +
        'Recommended fields: ["messages", "message_template_status_update"]'
      ));
    }

    // Strict validation: All fields must be non-empty strings
    const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
    if (invalidFields.length > 0) {
      return next(createValidationError(
        'All fields must be non-empty strings. Invalid fields found: ' + JSON.stringify(invalidFields)
      ));
    }

    // Strict validation: Check for valid field names
    const validFieldNames = [
      'messages',
      'message_template_status_update',
      'messaging_postbacks',
      'messaging_optins',
      'message_deliveries',
      'message_reads',
      'messaging_referrals',
      'messaging_account_linking',
      'account_update',
      'phone_number_name_update',
      'phone_number_quality_update',
      'template_category_update'
    ];

    const unknownFields = fields.filter(f => !validFieldNames.includes(f));
    if (unknownFields.length > 0) {
      logger.warn('Unknown webhook fields provided', { unknownFields, subDomain });
      // Don't fail, just warn - Meta might add new fields
    }

    // Strict validation: Recommend essential fields
    const hasMessages = fields.includes('messages');
    const hasTemplateUpdates = fields.includes('message_template_status_update');

    if (!hasMessages && !hasTemplateUpdates) {
      logger.warn('Webhook subscription missing essential fields', {
        subDomain,
        providedFields: fields,
        recommendedFields: ['messages', 'message_template_status_update']
      });
    }

    const result = await MetaWhatsAppService.subscribeWebhook(
      subDomain,
      webhookUrl,
      verifyToken,
      fields,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Webhook subscription created successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to subscribe to webhooks',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error subscribing to webhooks:', error);
    next(createServerError(error.message || 'Failed to subscribe to webhooks', error));
  }
};

/**
 * Update webhook subscription
 * PUT /api/v1/whatsapp/webhooks/subscriptions
 */
export const updateWebhookSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { fields } = req.body;

    // Strict validation: Fields is required
    if (!fields) {
      return next(createValidationError('Missing required field: fields'));
    }

    // Strict validation: Fields must be an array
    if (!Array.isArray(fields)) {
      return next(createValidationError('Fields must be an array'));
    }

    // Strict validation: Fields cannot be empty
    if (fields.length === 0) {
      return next(createValidationError(
        'Fields array cannot be empty. You must subscribe to at least one webhook field. ' +
        'To unsubscribe completely, use DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId instead. ' +
        'Recommended fields: ["messages", "message_template_status_update"]'
      ));
    }

    // Strict validation: All fields must be non-empty strings
    const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
    if (invalidFields.length > 0) {
      return next(createValidationError(
        'All fields must be non-empty strings. Invalid fields found: ' + JSON.stringify(invalidFields)
      ));
    }

    // Strict validation: Check for valid field names
    const validFieldNames = [
      'messages',
      'message_template_status_update',
      'messaging_postbacks',
      'messaging_optins',
      'message_deliveries',
      'message_reads',
      'messaging_referrals',
      'messaging_account_linking',
      'account_update',
      'phone_number_name_update',
      'phone_number_quality_update',
      'template_category_update'
    ];

    const unknownFields = fields.filter(f => !validFieldNames.includes(f));
    if (unknownFields.length > 0) {
      logger.warn('Unknown webhook fields provided for update', { unknownFields, subDomain });
      // Don't fail, just warn - Meta might add new fields
    }

    // Strict validation: Recommend essential fields
    const hasMessages = fields.includes('messages');
    const hasTemplateUpdates = fields.includes('message_template_status_update');

    if (!hasMessages && !hasTemplateUpdates) {
      logger.warn('Webhook subscription update missing essential fields', {
        subDomain,
        providedFields: fields,
        recommendedFields: ['messages', 'message_template_status_update']
      });
    }

    const result = await MetaWhatsAppService.updateWebhookSubscription(
      subDomain,
      fields,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Webhook subscription updated successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to update webhook subscription',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error updating webhook subscription:', error);
    next(createServerError(error.message || 'Failed to update webhook subscription', error));
  }
};

/**
 * Delete webhook subscription
 * DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId
 */
export const deleteWebhookSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { appId } = req.params;

    if (!appId) {
      return next(createValidationError('Missing appId parameter'));
    }

    const result = await MetaWhatsAppService.deleteWebhookSubscription(
      subDomain,
      appId,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Webhook subscription deleted successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to delete webhook subscription',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error deleting webhook subscription:', error);
    next(createServerError(error.message || 'Failed to delete webhook subscription', error));
  }
};

/**
 * Create message template
 * POST /api/v1/whatsapp/templates
 */
export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { name, category, language, components } = req.body;

    if (!name || !category || !language || !components) {
      return next(createValidationError('Missing required fields: name, category, language, components'));
    }

    const result = await MetaWhatsAppService.createTemplate(
      subDomain,
      { name, category, language, components },
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Template created successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to create template',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error creating template:', error);
    next(createServerError(error.message || 'Failed to create template', error));
  }
};

/**
 * Get template status
 * GET /api/v1/whatsapp/templates/:templateName/status
 */
export const getTemplateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { templateName } = req.params;

    if (!templateName) {
      return next(createValidationError('Missing templateName parameter'));
    }

    const result = await MetaWhatsAppService.getTemplateStatus(
      subDomain,
      templateName,
      localId
    );

    res.json({
      type: '1',
      message: 'Template status retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting template status:', error);
    next(createServerError(error.message || 'Failed to get template status', error));
  }
};

/**
 * Delete template
 * DELETE /api/v1/whatsapp/templates/:templateName
 */
export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { templateName } = req.params;
    const { hsmId } = req.body;

    if (!templateName || !hsmId) {
      return next(createValidationError('Missing required fields: templateName (param), hsmId (body)'));
    }

    const result = await MetaWhatsAppService.deleteTemplate(
      subDomain,
      templateName,
      hsmId,
      localId
    );

    if (result.success) {
      res.json({
        type: '1',
        message: 'Template deleted successfully',
        data: result,
      });
    } else {
      res.status(400).json({
        type: '3',
        message: result.error || 'Failed to delete template',
        data: result,
      });
    }
  } catch (error: any) {
    logger.error('Error deleting template:', error);
    next(createServerError(error.message || 'Failed to delete template', error));
  }
};

// Add to whatsappController.ts

/**
 * Get template library
 * GET /api/v1/whatsapp/templates/library
 */
export const getTemplateLibrary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { language } = req.query;
      const { getTemplatesByLanguage } = await import('../utils/templates');
    
    const templates = getTemplatesByLanguage((language as string) || 'en');
    
    res.json({
      type: '1',
      message: 'Template library retrieved successfully',
      data: {
        templates,
        totalCount: templates.length,
        language: language || 'en',
      },
    });
  } catch (error: any) {
    logger.error('Error getting template library:', error);
    next(createServerError(error.message || 'Failed to get template library', error));
  }
};

/**
 * Get specific template from library
 * GET /api/v1/whatsapp/templates/library/:templateId
 */
export const getTemplateFromLibrary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId } = req.params;
    const { language } = req.query;
    const { getTemplateById } = await import('../utils/templates');
    
    const template = getTemplateById(templateId, (language as string) || 'en');
    
    if (!template) {
      return next(createValidationError(`Template ${templateId} not found in library`));
    }
    
    res.json({
      type: '1',
      message: 'Template retrieved successfully',
      data: template,
    });
  } catch (error: any) {
    logger.error('Error getting template from library:', error);
    next(createServerError(error.message || 'Failed to get template', error));
  }
};

/**
 * Provision selected templates from library
 * POST /api/v1/whatsapp/templates/provision-selected
 */
export const provisionSelectedTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { templateIds, language } = req.body;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return next(createValidationError('templateIds must be a non-empty array'));
    }

    const lang = language || 'en';

    // Get template definitions from library
    const templates = templateIds
      .map(id => getTemplateById(id, lang))
      .filter(t => t !== undefined) as any[];

    if (templates.length === 0) {
      return next(createValidationError('No valid templates found in library'));
    }

    // Create templates via Meta API
    const results = [];
    for (const template of templates) {
      try {
        const result = await MetaWhatsAppService.createTemplate(
          subDomain,
          {
            name: template.name,
            category: template.category,
            language: template.language,
            components: template.components,
          },
          localId
        );
        results.push({
          templateId: template.id,
          templateName: template.name,
          success: result.success,
          status: result.status || 'PENDING',
          error: result.error,
        });
      } catch (error: any) {
        logger.error(`Error creating template ${template.name}:`, error);
        results.push({
          templateId: template.id,
          templateName: template.name,
          success: false,
          error: error.message,
        });
      }
    }

    // Update business model with template tracking
    const business = await Business.findOne({ subDomain });
    if (business) {
      results.forEach((result) => {
        if (result.success) {
          if (!business.whatsappTemplates) {
            business.whatsappTemplates = [];
          }
          
          const existingIndex = business.whatsappTemplates.findIndex(
            (t) => t.name === result.templateName
          );
          
          if (existingIndex >= 0) {
            business.whatsappTemplates[existingIndex].status = result.status as any;
          } else {
            business.whatsappTemplates.push({
              name: result.templateName,
              templateId: result.templateId,
              status: result.status as any,
              createdAt: new Date(),
              language: lang,
              category: 'UTILITY',
            });
          }
        }
      });
      
      await business.save();
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      type: '1',
      message: `Provisioned ${successCount} templates successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error provisioning selected templates:', error);
    next(createServerError(error.message || 'Failed to provision templates', error));
  }
};

/**
 * Provision default templates
 * POST /api/v1/whatsapp/templates/provision
 */
export const provisionTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { language } = req.body;

    const { templateProvisioningService } = await import('../services/whatsapp/templateProvisioningService');
    const result = await templateProvisioningService.provisionTemplates(
      subDomain,
      language || 'es_PE',
      localId
    );

    // Update business model with template tracking
    const business = await Business.findOne({ subDomain });
    if (business) {
      business.templatesProvisioned = result.success;
      business.templatesProvisionedAt = new Date();
      
      // Update template tracking
      if (!business.whatsappTemplates) {
        business.whatsappTemplates = [];
      }
      
      result.results.forEach((templateResult) => {
        const existingIndex = business.whatsappTemplates!.findIndex(
          (t) => t.name === templateResult.templateName
        );
        
        if (existingIndex >= 0) {
          business.whatsappTemplates![existingIndex] = {
            name: templateResult.templateName,
            templateId: templateResult.templateId,
            status: (templateResult.status as any) || 'PENDING',
            createdAt: business.whatsappTemplates![existingIndex].createdAt,
            approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
            language: language || 'es_PE',
                  category: 'UTILITY',
          };
        } else {
          business.whatsappTemplates!.push({
            name: templateResult.templateName,
            templateId: templateResult.templateId,
            status: (templateResult.status as any) || 'PENDING',
            createdAt: new Date(),
            approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
            language: language || 'es_PE',
                  category: 'UTILITY',
          });
        }
      });
      
      await business.save();
    }

    res.json({
      type: '1',
      message: `Template provisioning ${result.success ? 'completed' : 'completed with errors'}`,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error provisioning templates:', error);
    next(createServerError(error.message || 'Failed to provision templates', error));
  }
};

/**
 * Check template statuses
 * GET /api/v1/whatsapp/templates/statuses
 */
export const checkTemplateStatuses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);

    const { templateProvisioningService } = await import('../services/whatsapp/templateProvisioningService');
    const statuses = await templateProvisioningService.checkTemplateStatuses(
      subDomain,
      localId
    );

    res.json({
      type: '1',
      message: 'Template statuses retrieved successfully',
      data: statuses,
    });
  } catch (error: any) {
    logger.error('Error checking template statuses:', error);
    next(createServerError(error.message || 'Failed to check template statuses', error));
  }
};

/**
 * Redact sensitive data from webhook payload for logging
 * Removes PII like phone numbers, message text, templates, etc.
 * Keeps only safe metadata like IDs, event types, timestamps
 */
const redactWebhookPayload = (body: any): any => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const redacted = { ...body };

  if (redacted.entry && Array.isArray(redacted.entry)) {
    redacted.entry = redacted.entry.map((entry: any) => {
      const redactedEntry: any = {
        id: entry.id,
        time: entry.time,
      };

      if (entry.changes && Array.isArray(entry.changes)) {
        redactedEntry.changes = entry.changes.map((change: any) => {
          const redactedChange: any = {
            field: change.field,
            value: {},
          };

          // Keep only safe metadata from value
          if (change.value) {
            const value = change.value;
            
            // Keep metadata only
            if (value.metadata) {
              redactedChange.value.metadata = {
                phone_number_id: value.metadata.phone_number_id
                  ? '[REDACTED]'
                  : undefined,
                display_phone_number: value.metadata.display_phone_number
                  ? '[REDACTED]'
                  : undefined,
              };
            }

            // For messages: keep IDs, redact content
            if (value.messages && Array.isArray(value.messages)) {
              redactedChange.value.messages = value.messages.map((msg: any) => ({
                id: msg.id,
                type: msg.type,
                timestamp: msg.timestamp,
                from: msg.from ? '[REDACTED]' : undefined,
                // Don't log: text, caption, media, location, contacts, etc.
              }));
            }

            // For statuses: keep IDs and status, redact recipient
            if (value.statuses && Array.isArray(value.statuses)) {
              redactedChange.value.statuses = value.statuses.map((status: any) => ({
                id: status.id,
                status: status.status,
                timestamp: status.timestamp,
                // Don't log: recipient_id, conversation, pricing, etc.
              }));
            }

            // For templates: keep IDs only
            if (value.message_template_id) {
              redactedChange.value.message_template_id = value.message_template_id;
            }
            if (value.message_template_name) {
              redactedChange.value.message_template_name = '[REDACTED]';
            }
            if (value.message_template_language) {
              redactedChange.value.message_template_language = value.message_template_language;
            }
          }

          return redactedChange;
        });
      }

      return redactedEntry;
    });
  }

  return redacted;
};

/**
 * Verify Meta webhook signature using X-Hub-Signature-256
 * Uses SHA-256 HMAC with the App Secret
 * 
 * @param rawBody - Raw request body as string (before JSON parsing)
 * @param signature - X-Hub-Signature-256 header value (format: sha256=<signature>)
 * @param secret - Facebook App Secret
 * @returns true if signature is valid, false otherwise
 */
const verifyWebhookSignature = (
  rawBody: string,
  signature: string,
  secret: string
): boolean => {
  try {
    if (!signature || !secret || !rawBody) {
      return false;
    }

    // Extract signature value (remove 'sha256=' prefix if present)
    const signatureValue = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    // Compute expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (signatureValue.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signatureValue, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error(`Error verifying webhook signature: ${error}`);
    return false;
  }
};

/**
 * Exchange Facebook OAuth authorization code for access token
 * POST /api/v1/whatsapp/facebook/exchange-token
 * Stores the access token securely (encrypted) in the database
 */
export const exchangeToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = getBusinessContext(req);
    const { code, waba_id, phone_number_id, redirect_uri } = req.body;

    if (!waba_id) {
      return next(createValidationError('WABA ID is required'));
    }
    if (!phone_number_id) {
      return next(createValidationError('Phone number ID is required'));
    }
    if (!code) {
      return next(createValidationError('Authorization code is required'));
    }

    // Exchange authorization code for access token
    // Use redirect_uri from request body if provided, otherwise use environment variable
    // The redirect_uri MUST exactly match the one used in the OAuth authorization request
    let tokenResponse;
    try {
      tokenResponse = await MetaWhatsAppService.exchangeAuthorizationCode(code, redirect_uri);
    } catch (error: any) {
      // Check if this is an expired authorization code error
      if (error.isExpiredCode) {
        logger.error('Authorization code has expired', {
          subDomain,
          localId,
          errorCode: error.errorCode,
          errorSubcode: error.errorSubcode,
        });
        return next(createServerError(
          'Authorization code has expired. Facebook OAuth codes expire after approximately 10 minutes. Please initiate a new OAuth flow to get a fresh authorization code.',
          error
        ));
      }
      
      // Check if this is a redirect URI mismatch error
      if (error.isRedirectUriMismatch) {
        logger.error('Redirect URI mismatch', {
          subDomain,
          localId,
          errorCode: error.errorCode,
          errorSubcode: error.errorSubcode,
          redirectUri: error.redirectUri,
          providedRedirectUri: redirect_uri,
          envRedirectUri: process.env.FACEBOOK_REDIRECT_URI,
        });
        return next(createServerError(
          `Redirect URI mismatch: The redirect_uri used in the token exchange must exactly match the one used in the OAuth authorization request. ` +
          `Provided redirect_uri: ${redirect_uri || 'using environment variable'}, ` +
          `Environment redirect_uri: ${process.env.FACEBOOK_REDIRECT_URI || 'not set'}. ` +
          `Please ensure the redirect_uri parameter in your OAuth authorization URL matches exactly (including protocol, domain, path, and trailing slashes).`,
          error
        ));
      }
      
      // Check if redirect URI is missing
      if (error.isMissingRedirectUri) {
        logger.error('Missing redirect URI', {
          subDomain,
          localId,
          providedRedirectUri: redirect_uri,
          envRedirectUri: process.env.FACEBOOK_REDIRECT_URI,
        });
        return next(createServerError(
          'Redirect URI is required for OAuth token exchange. Please provide redirect_uri in the request body or set FACEBOOK_REDIRECT_URI environment variable.',
          error
        ));
      }
      
      // Re-throw other errors to be handled by the outer catch block
      throw error;
    }

    logger.info('Token response:', tokenResponse);

    if (!tokenResponse || !tokenResponse.access_token) {
      logger.error('Failed to exchange authorization code for access token', {
        subDomain,
        localId,
        hasCode: !!code,
      });
      return next(createServerError('Failed to exchange authorization code for access token', null));
    }

    // Get business to update
    let business;
    if (localId) {
      const { BusinessLocation } = await import('../models/BusinessLocation');
      const businessLocation = await BusinessLocation.findOne({ 
        subDomain, 
        localId 
      });
      if (!businessLocation) {
        logger.error('BusinessLocation not found for token exchange', { subDomain, localId });
        return next(createServerError('Business location not found', null));
      }
      business = await Business.findOne({ businessId: businessLocation.businessId });
    } else {
      business = await Business.findOne({ subDomain });
    }
    
    if (!business) {
      logger.error('Business not found for token exchange', { subDomain, localId });
      return next(createServerError('Business not found', null));
    }

    // Normalize date fields if they're in extended JSON format (defensive fix)
    // This handles cases where hooks might not catch the issue
    if (business.createdAt && typeof business.createdAt === 'object' && business.createdAt !== null && !(business.createdAt instanceof Date) && (business.createdAt as any).$date) {
      try {
        const before = business.createdAt;
        business.createdAt = new Date((business.createdAt as any).$date);
        business.markModified('createdAt');
        logger.debug('Normalized createdAt in controller', { before, after: business.createdAt });
      } catch (err) {
        logger.error('Error normalizing createdAt in controller:', err);
      }
    }
    if (business.updatedAt && typeof business.updatedAt === 'object' && business.updatedAt !== null && !(business.updatedAt instanceof Date) && (business.updatedAt as any).$date) {
      try {
        const before = business.updatedAt;
        business.updatedAt = new Date((business.updatedAt as any).$date);
        business.markModified('updatedAt');
        logger.debug('Normalized updatedAt in controller', { before, after: business.updatedAt });
      } catch (err) {
        logger.error('Error normalizing updatedAt in controller:', err);
      }
    }

    // Calculate expiration date
    const expiresIn = tokenResponse.expires_in || 5184000; // Default to 60 days if not provided
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Update business with encrypted token and metadata
    // The token will be automatically encrypted by the pre-save middleware
    business.whatsappAccessToken = tokenResponse.access_token;
    business.whatsappTokenExpiresAt = expiresAt;

    // Update WABA ID and phone number ID if provided
    if (waba_id) {
      business.wabaId = waba_id;
    }
    if (phone_number_id) {
      // Add to phone number IDs array if not already present
      if (!business.whatsappPhoneNumberIds || !Array.isArray(business.whatsappPhoneNumberIds)) {
        business.whatsappPhoneNumberIds = [];
      }
      if (!business.whatsappPhoneNumberIds.includes(phone_number_id)) {
        business.whatsappPhoneNumberIds.push(phone_number_id);
      }
    }

    await business.save();

    logger.info('Successfully exchanged authorization code and stored access token', {
      subDomain,
      localId,
      wabaId: waba_id,
      phoneNumberId: phone_number_id,
      expiresAt: expiresAt.toISOString(),
    });

    res.json({
      type: '1',
      message: 'Token exchanged and stored successfully',
      data: {
        expiresAt: expiresAt.toISOString(),
        expiresIn: expiresIn,
        wabaId: business.wabaId,
        phoneNumberIds: business.whatsappPhoneNumberIds,
      },
    });
  } catch (error: any) {
    logger.error('Error exchanging authorization code:', error);
    next(createServerError(error.message || 'Failed to exchange authorization code', error));
  }
};

/**
 * Handle incoming webhook from Meta WhatsApp Business API
 * POST /api/v1/whatsapp/webhook
 * 
 * Handles multiple businesses by identifying them through:
 * - Phone Number ID (from webhook metadata)
 * - WABA ID (from entry ID)
 * 
 * Supports all Meta webhook event types:
 * - messages (incoming messages)
 * - statuses (message delivery status)
 * - message_template_status_update (template approval status)
 * 
 * Security: Verifies X-Hub-Signature-256 before processing events
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    // Verify webhook (for initial setup) - GET request
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token) {
      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      if (token === verifyToken) {
        logger.info('WhatsApp webhook verified');
        return res.status(200).send(challenge);
      } else {
        logger.error('WhatsApp webhook verification failed - Invalid token');
        return res.status(403).json({
          type: '3',
          message: 'Invalid verify token',
          data: null,
        });
      }
    }

    // For POST requests (webhook events), verify signature before processing
    // GET requests (webhook verification) don't need signature verification
    if (req.method === 'POST') {
      const signature = req.headers['x-hub-signature-256'] as string;
      const appSecret = process.env.FACEBOOK_APP_SECRET;

      if (!appSecret) {
        logger.error('FACEBOOK_APP_SECRET not configured - cannot verify webhook signature');
        return res.status(500).json({
          type: '3',
          message: 'Webhook signature verification not configured',
          data: null,
        });
      }

      if (!signature) {
        logger.error('Webhook signature missing - X-Hub-Signature-256 header not found');
        return res.status(403).json({
          type: '3',
          message: 'Webhook signature required',
          data: null,
        });
      }

      // Get raw body for signature verification (captured by app middleware)
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      
      // Verify signature before processing any events
      const isValidSignature = verifyWebhookSignature(rawBody, signature, appSecret);
      
      if (!isValidSignature) {
        logger.error('Invalid webhook signature - potential spoofing attempt', {
          signatureReceived: signature.substring(0, 20) + '...',
          hasRawBody: !!rawBody,
          rawBodyLength: rawBody?.length || 0,
        });
        return res.status(403).json({
          type: '3',
          message: 'Invalid webhook signature',
          data: null,
        });
      }

      logger.info('Webhook signature verified successfully');
    }

    // Handle webhook events
    const body = req.body;
    
    // Log redacted payload (no PII - only IDs, types, timestamps)
    const redactedBody = redactWebhookPayload(body);
    logger.info('Received WhatsApp webhook event', {
      object: body.object,
      entryCount: body.entry?.length || 0,
      redactedPayload: redactedBody,
    });

    // Process webhook events for whatsapp_business_account object
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      // Queue each entry for async processing
      for (const entry of entries) {
        try {
          // Identify which business this webhook belongs to (quick synchronous lookup)
          const { extractBusinessFromWebhook } = await import(
            '../services/whatsapp/metaWhatsAppWebhookService'
          );

          const businessInfo = await extractBusinessFromWebhook(entry);

          if (!businessInfo) {
            logger.warn('Could not identify business for webhook entry', {
              entryId: entry.id,
            });
            continue; // Skip this entry but process others
          }

          const { business } = businessInfo;

          logger.info(
            `Queueing webhook entry for async processing: ${business.subDomain}`,
            {
              entryId: entry.id,
              wabaId: business.wabaId,
            }
          );

          // Queue the entry for async processing via Inngest
          const { inngest } = await import('../services/inngestService');
          
          await inngest.send({
            name: 'whatsapp/webhook.entry',
            data: {
              businessId: (business._id as any).toString(),
              entry,
              subDomain: business.subDomain,
            },
          });

          logger.info(
            `Webhook entry queued for business: ${business.subDomain}`,
            {
              entryId: entry.id,
            }
          );
        } catch (entryError: any) {
          logger.error(`Error queueing webhook entry: ${entryError}`, {
            entryId: entry.id,
            error: entryError.message,
          });
          // Continue processing other entries even if one fails
          // Note: We still return 200 to Meta to prevent retries
        }
      }
    } else {
      logger.warn(`Unknown webhook object type: ${body.object}`);
    }

    // Always return 200 to acknowledge receipt (Meta expects this)
    res.status(200).json({
      type: '1',
      message: 'Webhook received',
      data: null,
    });
  } catch (error: any) {
    logger.error('Error handling webhook:', error);
    // Still return 200 to prevent Meta from retrying and causing issues
    res.status(200).json({
      type: '3',
      message: 'Error processing webhook',
      data: null,
    });
  }
};

