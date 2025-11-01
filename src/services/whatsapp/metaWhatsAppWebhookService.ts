import { Business, IBusiness } from '../../models/Business';
import logger from '../../utils/logger';

/**
 * Find business by WhatsApp phone number ID or WABA ID from webhook payload
 */
export const findBusinessByPhoneNumberId = async (
  phoneNumberId: string
): Promise<IBusiness | null> => {
  try {
    const business = await Business.findOne({
      whatsappPhoneNumberIds: { $in: [phoneNumberId] },
    });

    if (business) {
      logger.info(`Business found for phoneNumberId ${phoneNumberId}: ${business.subDomain}`);
      return business;
    }

    logger.warn(`No business found for phoneNumberId ${phoneNumberId}`);
    return null;
  } catch (error) {
    logger.error(`Error finding business by phoneNumberId: ${error}`);
    return null;
  }
};

/**
 * Find business by WABA ID from webhook payload
 */
export const findBusinessByWabaId = async (
  wabaId: string
): Promise<IBusiness | null> => {
  try {
    const business = await Business.findOne({ wabaId });

    if (business) {
      logger.info(`Business found for wabaId ${wabaId}: ${business.subDomain}`);
      return business;
    }

    logger.warn(`No business found for wabaId ${wabaId}`);
    return null;
  } catch (error) {
    logger.error(`Error finding business by wabaId: ${error}`);
    return null;
  }
};

/**
 * Extract business from webhook entry
 * Tries multiple strategies to identify the business
 */
export const extractBusinessFromWebhook = async (
  entry: any
): Promise<{ business: IBusiness; phoneNumberId?: string } | null> => {
  try {
    // Strategy 1: Try to get phoneNumberId from metadata or value
    let phoneNumberId: string | undefined;
    let wabaId: string | undefined;

    if (entry.changes && entry.changes.length > 0) {
      const change = entry.changes[0];
      
      // Extract from metadata
      if (change.value?.metadata) {
        phoneNumberId = change.value.metadata.phone_number_id;
        wabaId = change.value.metadata.waba_id;
      }

      // Extract from entry id (format: WABA_ID-PHONE_NUMBER_ID)
      if (entry.id && entry.id.includes('-')) {
        const parts = entry.id.split('-');
        if (parts.length >= 2) {
          wabaId = parts[0];
          phoneNumberId = parts[1];
        }
      }

      // Extract WABA ID from entry
      if (!wabaId && entry.id) {
        wabaId = entry.id;
      }
    }

    // Try phoneNumberId first (more specific)
    if (phoneNumberId) {
      const business = await findBusinessByPhoneNumberId(phoneNumberId);
      if (business) {
        return { business, phoneNumberId };
      }
    }

    // Fall back to WABA ID
    if (wabaId) {
      const business = await findBusinessByWabaId(wabaId);
      if (business) {
        return { business, phoneNumberId };
      }
    }

    logger.warn('Could not identify business from webhook entry', {
      entryId: entry.id,
      phoneNumberId,
      wabaId,
    });

    return null;
  } catch (error) {
    logger.error(`Error extracting business from webhook: ${error}`);
    return null;
  }
};

/**
 * Map Meta message format to our database message content format
 */
const mapMetaMessageToContent = (message: any): any => {
  const content: any = {};

  switch (message.type) {
    case 'text':
      content.text = message.text?.body || '';
      break;

    case 'image':
      content.mediaUrl = message.image?.id 
        ? `https://graph.facebook.com/v22.0/${message.image.id}` 
        : message.image?.link;
      content.text = message.image?.caption || '';
      break;

    case 'audio':
      content.mediaUrl = message.audio?.id
        ? `https://graph.facebook.com/v22.0/${message.audio.id}`
        : message.audio?.link;
      break;

    case 'video':
      content.mediaUrl = message.video?.id
        ? `https://graph.facebook.com/v22.0/${message.video.id}`
        : message.video?.link;
      content.text = message.video?.caption || '';
      break;

    case 'document':
      content.mediaUrl = message.document?.id
        ? `https://graph.facebook.com/v22.0/${message.document.id}`
        : message.document?.link;
      content.text = message.document?.filename || message.document?.caption || '';
      break;

    case 'location':
      content.location = {
        latitude: message.location?.latitude || 0,
        longitude: message.location?.longitude || 0,
        name: message.location?.name || '',
        address: message.location?.address || '',
      };
      break;

    case 'contacts':
      if (message.contacts && message.contacts.length > 0) {
        const contact = message.contacts[0];
        content.contact = {
          name: contact.name?.formatted_name || contact.name?.first_name || '',
          phone: contact.phones?.[0]?.phone || '',
        };
      }
      break;

    case 'interactive':
      content.interactive = {
        type: message.interactive?.type || 'button',
        body: message.interactive?.body?.text || '',
        footer: message.interactive?.footer?.text,
        action: message.interactive?.action || {},
      };
      break;

    case 'template':
      content.template = {
        name: message.template?.name || '',
        language: message.template?.language || 'en_US',
        components: message.template?.components || [],
      };
      break;

    default:
      content.text = `Unsupported message type: ${message.type}`;
  }

  return content;
};

/**
 * Process incoming message webhook event
 */
export const processIncomingMessage = async (
  business: any,
  message: any,
  metadata?: any
): Promise<void> => {
  try {
    const { from, id: messageId, type, timestamp } = message;
    const messageTimestamp = new Date(parseInt(timestamp) * 1000);

    logger.info(`Processing incoming message for business ${business.subDomain}`, {
      from,
      messageId,
      type,
      timestamp: messageTimestamp,
    });

    // Import models
    const { WhatsAppChat, ChatMessage, WhatsAppCustomer } = await import('../../models/WhatsApp');

    // Find or create customer record
    let customer = await WhatsAppCustomer.findOne({
      phone: from,
      subDomain: business.subDomain.toLowerCase(),
    });

    if (!customer) {
      customer = new WhatsAppCustomer({
        phone: from,
        subDomain: business.subDomain.toLowerCase(),
        lastInteraction: messageTimestamp,
      });
      await customer.save();
      logger.info(`Created new customer record for ${from}`);
    } else {
      customer.lastInteraction = messageTimestamp;
      await customer.save();
    }

    // Find or create chat
    let chat = await WhatsAppChat.findOne({
      customerPhone: from,
      subDomain: business.subDomain.toLowerCase(),
    });

    if (!chat) {
      chat = new WhatsAppChat({
        customerPhone: from,
        customerName: customer.name,
        subDomain: business.subDomain.toLowerCase(),
        isActive: true,
        messageCount: 0,
        context: {
          userData: {},
          conversationHistory: [],
        },
      });
      await chat.save();
      logger.info(`Created new chat for customer ${from}`);
    }

    // Map Meta message format to our content format
    const content = mapMetaMessageToContent(message);

    // Extract text for chat preview
    const previewText =
      content.text ||
      content.location?.name ||
      (content.contact ? `Contact: ${content.contact.name}` : '') ||
      (content.interactive ? content.interactive.body : '') ||
      'Media message';

    // Create message record
    const chatMessage = new ChatMessage({
      chatId: chat._id.toString(),
      type: type as any,
      direction: 'inbound',
      content,
      timestamp: messageTimestamp,
      status: 'delivered', // Incoming messages are always delivered
      subDomain: business.subDomain.toLowerCase(),
      metadata: {
        messageId,
        rawMessage: message,
        metadata: metadata || {},
      },
    });

    await chatMessage.save();
    logger.info(`Saved incoming message ${messageId} to database`);

    // Update chat with new message
    chat.lastMessage = previewText.substring(0, 1000);
    chat.lastMessageTime = messageTimestamp;
    chat.messageCount += 1;
    chat.isActive = true;
    
    // Add message to conversation history context
    if (chat.context.conversationHistory.length < 100) {
      // Keep last 100 messages in context
      chat.context.conversationHistory.push(chatMessage._id as any);
    }

    await chat.save();

    // Update customer interaction
    customer.addInteraction({
      type: 'message',
      timestamp: messageTimestamp,
      description: `Received ${type} message`,
    });

    logger.info(`Incoming message processed for business ${business.subDomain}`, {
      messageId,
      from,
      chatId: chat._id.toString(),
    });
  } catch (error) {
    logger.error(`Error processing incoming message: ${error}`);
    throw error;
  }
};

/**
 * Process message status update webhook event
 */
export const processMessageStatus = async (
  business: any,
  status: any
): Promise<void> => {
  try {
    const { id: messageId, status: statusType, timestamp } = status;
    const statusTimestamp = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date();

    logger.info(`Processing message status update for business ${business.subDomain}`, {
      messageId,
      status: statusType,
      timestamp: statusTimestamp,
    });

    // Import models
    const { ChatMessage } = await import('../../models/WhatsApp');

    // Map Meta status to our status enum
    let mappedStatus: 'sent' | 'delivered' | 'read' | 'failed' | 'pending' = 'pending';
    switch (statusType) {
      case 'sent':
        mappedStatus = 'sent';
        break;
      case 'delivered':
        mappedStatus = 'delivered';
        break;
      case 'read':
        mappedStatus = 'read';
        break;
      case 'failed':
        mappedStatus = 'failed';
        break;
      default:
        mappedStatus = 'pending';
    }

    // Update message status in database
    const result = await ChatMessage.updateOne(
      {
        'metadata.messageId': messageId,
        subDomain: business.subDomain.toLowerCase(),
        direction: 'outbound', // Only update status for outbound messages
      },
      {
        $set: {
          status: mappedStatus,
          updatedAt: statusTimestamp,
          'metadata.statusUpdate': {
            status: statusType,
            timestamp: statusTimestamp,
            recipientId: status.recipient_id,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      logger.warn(
        `No outbound message found with messageId ${messageId} for business ${business.subDomain}`
      );
    } else {
      logger.info(`Message status updated for business ${business.subDomain}`, {
        messageId,
        status: mappedStatus,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    }
  } catch (error) {
    logger.error(`Error processing message status: ${error}`);
    throw error;
  }
};

/**
 * Process template message status update
 */
export const processTemplateStatus = async (
  business: any,
  templateStatus: any
): Promise<void> => {
  try {
    const { event, message_template_id, message_template_name, message_template_language } =
      templateStatus;

    logger.info(`Processing template status for business ${business.subDomain}`, {
      event,
      templateId: message_template_id,
      templateName: message_template_name,
      language: message_template_language,
    });

    // TODO: Handle template status updates
    // This can be used to track template approval/rejection status

    logger.info(`Template status processed for business ${business.subDomain}`, {
      event,
      templateId: message_template_id,
    });
  } catch (error) {
    logger.error(`Error processing template status: ${error}`);
    throw error;
  }
};

/**
 * Process webhook events for a specific business
 */
export const processWebhookEvents = async (
  business: any,
  entry: any
): Promise<void> => {
  try {
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field === 'messages') {
        const value = change.value;

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await processIncomingMessage(business, message, value.metadata);
          }
        }

        // Handle message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await processMessageStatus(business, status);
          }
        }
      } else if (change.field === 'message_template_status_update') {
        // Handle template status updates
        if (change.value) {
          await processTemplateStatus(business, change.value);
        }
      } else {
        logger.info(
          `Unhandled webhook field for business ${business.subDomain}: ${change.field}`
        );
      }
    }
  } catch (error) {
    logger.error(`Error processing webhook events: ${error}`);
    throw error;
  }
};

