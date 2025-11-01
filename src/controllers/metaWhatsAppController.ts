import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { MetaWhatsAppService } from '../services/whatsapp/metaWhatsAppService';
import { WhatsAppAPIError, createValidationError, createServerError } from '../utils/whatsappErrors';

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

      for (const entry of entries) {
        try {
          // Identify which business this webhook belongs to
          const { extractBusinessFromWebhook, processWebhookEvents } = await import(
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
            `Processing webhook events for business: ${business.subDomain}`,
            {
              entryId: entry.id,
              wabaId: business.wabaId,
            }
          );

          // Process all events for this business
          await processWebhookEvents(business, entry);

          logger.info(
            `Webhook events processed for business: ${business.subDomain}`
          );
        } catch (entryError: any) {
          logger.error(`Error processing webhook entry: ${entryError}`, {
            entryId: entry.id,
            error: entryError.message,
          });
          // Continue processing other entries even if one fails
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

