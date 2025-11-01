import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { MetaWhatsAppService } from '../services/whatsapp/metaWhatsAppService';
import authenticate from '../middleware/auth';

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

  throw new Error('Business context (subDomain) is required');
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
      return res.status(400).json({
        type: '3',
        message: 'Missing required fields: to, text',
        data: null,
      });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to send message',
      data: null,
    });
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
      return res.status(400).json({
        type: '3',
        message: 'Missing required fields: to, templateName',
        data: null,
      });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to send template message',
      data: null,
    });
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
      return res.status(400).json({
        type: '3',
        message: 'Missing required fields: to, type, body, action',
        data: null,
      });
    }

    if (type !== 'button' && type !== 'list') {
      return res.status(400).json({
        type: '3',
        message: 'Type must be either "button" or "list"',
        data: null,
      });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to send interactive message',
      data: null,
    });
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
      return res.status(400).json({
        type: '3',
        message: 'Missing required fields: to, type',
        data: null,
      });
    }

    if (!mediaId && !mediaUrl) {
      return res.status(400).json({
        type: '3',
        message: 'Either mediaId or mediaUrl must be provided',
        data: null,
      });
    }

    const validTypes = ['image', 'audio', 'video', 'document'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        type: '3',
        message: `Type must be one of: ${validTypes.join(', ')}`,
        data: null,
      });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to send media message',
      data: null,
    });
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
      return res.status(400).json({
        type: '3',
        message: 'Missing messageId parameter',
        data: null,
      });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to mark message as read',
      data: null,
    });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to get templates',
      data: null,
    });
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
    res.status(500).json({
      type: '3',
      message: error.message || 'Failed to get phone numbers',
      data: null,
    });
  }
};

/**
 * Handle incoming webhook from Meta WhatsApp Business API
 * POST /api/v1/whatsapp/webhook
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verify webhook (for initial setup)
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

    // Handle webhook events
    const body = req.body;
    logger.info('Received WhatsApp webhook event:', JSON.stringify(body, null, 2));

    // Process webhook events
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                logger.info(`Message status update: ${status.id} - ${status.status}`);
                // TODO: Update message status in database
              }
            }

            // Handle incoming messages
            if (value.messages) {
              for (const message of value.messages) {
                logger.info(`Incoming message from ${message.from}: ${message.type}`);
                // TODO: Process incoming message and trigger business logic
              }
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      type: '1',
      message: 'Webhook received',
      data: null,
    });
  } catch (error: any) {
    logger.error('Error handling webhook:', error);
    // Still return 200 to prevent Meta from retrying
    res.status(200).json({
      type: '3',
      message: 'Error processing webhook',
      data: null,
    });
  }
};

