import { Business } from '../../models/Business';
import logger from '../../utils/logger';

const META_API_VERSION = 'v22.0';
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface SendTextMessageParams {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: any[];
}

export interface SendInteractiveMessageParams {
  to: string;
  type: 'button' | 'list';
  body: string;
  footer?: string;
  header?: any;
  action: any;
}

export interface SendMediaMessageParams {
  to: string;
  type: 'image' | 'audio' | 'video' | 'document';
  mediaId?: string;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
}

export class MetaWhatsAppService {
  /**
   * Get business by subDomain and optional localId
   * Private helper method to avoid duplicate business lookups
   */
  private static async getBusinessBySubDomain(
    subDomain: string,
    localId?: string
  ): Promise<any | null> {
    try {
      // If localId is provided, find the BusinessLocation first, then get the parent Business
      let business;
      if (localId) {
        const { BusinessLocation } = await import('../../models/BusinessLocation');
        const businessLocation = await BusinessLocation.findOne({ 
          subDomain, 
          localId 
        });
        if (!businessLocation) {
          logger.error(`BusinessLocation not found for subDomain ${subDomain}, localId ${localId}`);
          return null;
        }
        // Get the parent business using the businessId from the location
        business = await Business.findOne({ businessId: businessLocation.businessId });
      } else {
        // Find business directly by subDomain
        business = await Business.findOne({ subDomain });
      }

      return business;
    } catch (error) {
      logger.error(`Error getting business for ${subDomain}: ${error}`);
      return null;
    }
  }

  /**
   * Get a valid WhatsApp Business API access token for a business
   * Handles token refresh if needed
   * @param subDomain - Business subdomain
   * @param localId - Optional business location ID
   * @param business - Optional business object (to avoid duplicate lookup)
   */
  static async getValidAccessToken(
    subDomain: string,
    localId?: string,
    business?: any
  ): Promise<string | null> {
    try {
      // Use provided business or fetch it
      const businessDoc = business || await this.getBusinessBySubDomain(subDomain, localId);

      if (!businessDoc || !businessDoc.whatsappAccessToken) {
        logger.error(`No WhatsApp token found for business ${subDomain}`);
        return null;
      }

      // Get decrypted access token
      const decryptedToken = (businessDoc as any).getDecryptedWhatsAppAccessToken();
      if (!decryptedToken) {
        logger.error(`Failed to decrypt WhatsApp token for business ${subDomain}`);
        return null;
      }

      // Check if token is expired (if expiration date is set)
      if (
        businessDoc.whatsappTokenExpiresAt &&
        new Date() > businessDoc.whatsappTokenExpiresAt
      ) {
        logger.info(
          `WhatsApp token expired for business ${subDomain}, attempting refresh`
        );

        // Try to refresh the token
        const refreshed = await this.refreshAccessToken(decryptedToken);
        if (refreshed) {
          businessDoc.whatsappAccessToken = refreshed.access_token; // Will be encrypted by pre-save middleware
          businessDoc.whatsappTokenExpiresAt = new Date(
            Date.now() + refreshed.expires_in * 1000
          );
          await businessDoc.save();
          return refreshed.access_token;
        } else {
          logger.error(`Failed to refresh WhatsApp token for business ${subDomain}`);
          return null;
        }
      }

      return decryptedToken;
    } catch (error) {
      logger.error(
        `Error getting WhatsApp token for business ${subDomain}: ${error}`
      );
      return null;
    }
  }

  /**
   * Refresh a WhatsApp Business API access token
   * Uses GET with query parameters as per Meta OAuth spec
   * Handles both JSON and URL-encoded response formats
   */
  private static async refreshAccessToken(
    currentToken: string
  ): Promise<any> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID || '',
        client_secret: process.env.FACEBOOK_APP_SECRET || '',
        fb_exchange_token: currentToken,
      });

      const url = `${META_API_BASE_URL}/oauth/access_token?${params.toString()}`;

      logger.info('Refreshing WhatsApp token using query parameters');

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        // Try to get error details
        const contentType = response.headers.get('content-type') || '';
        let errorData: any = {};
        
        if (contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text().catch(() => '');
          // Try to parse URL-encoded error
          try {
            const urlParams = new URLSearchParams(text);
            errorData = Object.fromEntries(urlParams);
          } catch {
            errorData = { error: text };
          }
        }
        
        logger.error(`WhatsApp token refresh failed: ${response.status}`);
        logger.error(`Error: ${JSON.stringify(errorData)}`);
        return null;
      }

      // Handle response - can be JSON or URL-encoded
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // JSON response
        return await response.json();
      } else {
        // URL-encoded response (e.g., access_token=xxx&expires_in=3600)
        const text = await response.text();
        const urlParams = new URLSearchParams(text);
        
        // Convert URLSearchParams to object
        const result: any = {};
        urlParams.forEach((value, key) => {
          result[key] = value;
        });
        
        // Convert expires_in to number if present
        if (result.expires_in) {
          result.expires_in = parseInt(result.expires_in, 10);
        }
        
        logger.info('Token refreshed successfully (URL-encoded response)');
        return result;
      }
    } catch (error) {
      logger.error(`Error refreshing WhatsApp token: ${error}`);
      return null;
    }
  }

  /**
   * Get business configuration for WhatsApp API calls
   */
  static async getBusinessConfig(
    subDomain: string,
    localId?: string
  ): Promise<{
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
  } | null> {
    try {
      // Get business once (avoid duplicate lookup)
      const business = await this.getBusinessBySubDomain(subDomain, localId);

      if (!business) {
        logger.error(`Business not found: ${subDomain}`);
        return null;
      }

      if (!business.whatsappPhoneNumberIds || business.whatsappPhoneNumberIds.length === 0) {
        logger.error(`No WhatsApp phone number ID configured for business ${subDomain}`);
        return null;
      }

      if (!business.wabaId) {
        logger.error(`No WABA ID configured for business ${subDomain}`);
        return null;
      }

      // Pass business object to avoid duplicate lookup
      const accessToken = await this.getValidAccessToken(subDomain, localId, business);
      if (!accessToken) {
        logger.error(`No valid access token for business ${subDomain}`);
        return null;
      }

      // Use the first phone number ID (can be extended to support multiple)
      return {
        phoneNumberId: business.whatsappPhoneNumberIds[0],
        wabaId: business.wabaId,
        accessToken,
      };
    } catch (error) {
      logger.error(`Error getting business config: ${error}`);
      return null;
    }
  }

  /**
   * Make a Meta WhatsApp API call
   */
  private static async makeApiCall(
    phoneNumberId: string,
    accessToken: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any
  ): Promise<any> {
    try {
      const url = `${META_API_BASE_URL}/${phoneNumberId}/${endpoint}`;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      logger.info(`Making Meta WhatsApp API call: ${method} ${url}`);

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(
          `Meta WhatsApp API call failed: ${response.status} ${JSON.stringify(errorData)}`
        );
        throw new Error(
          `Meta WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error(`Meta WhatsApp API call error: ${error}`);
      throw error;
    }
  }

  /**
   * Save outbound message to database
   */
  private static async saveOutboundMessage(
    subDomain: string,
    to: string,
    messageType: string,
    content: any,
    messageId: string,
    localId?: string
  ): Promise<void> {
    try {
      const { WhatsAppChat, ChatMessage } = await import('../../models/WhatsApp');

      // Find or create chat
      let chat = await WhatsAppChat.findOne({
        customerPhone: to,
        subDomain: subDomain.toLowerCase(),
      });

      if (!chat) {
        chat = new WhatsAppChat({
          customerPhone: to,
          subDomain: subDomain.toLowerCase(),
          isActive: true,
          messageCount: 0,
          context: {
            userData: {},
            conversationHistory: [],
          },
        });
        await chat.save();
      }

      // Create message record
      const chatMessage = new ChatMessage({
        chatId: chat._id.toString(),
        type: messageType as any,
        direction: 'outbound',
        content,
        timestamp: new Date(),
        status: 'sent', // Initial status, will be updated by webhook
        subDomain: subDomain.toLowerCase(),
        localId: localId,
        metadata: {
          messageId,
        },
      });

      await chatMessage.save();

      // Update chat
      const previewText = content.text || content.interactive?.body || 'Media message';
      chat.lastMessage = previewText.substring(0, 1000);
      chat.lastMessageTime = new Date();
      chat.messageCount += 1;
      await chat.save();

      logger.info(`Saved outbound message ${messageId} to database`);
    } catch (error) {
      logger.error(`Error saving outbound message to database: ${error}`);
      // Don't throw - message was already sent successfully
    }
  }

  /**
   * Send a text message
   */
  static async sendTextMessage(
    subDomain: string,
    params: SendTextMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, text, previewUrl = false } = params;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: previewUrl,
          body: text,
        },
      };

      const response = await this.makeApiCall(
        config.phoneNumberId,
        config.accessToken,
        'messages',
        'POST',
        payload
      );

      // Save outbound message to database
      if (response.messages && response.messages.length > 0) {
        const messageId = response.messages[0].id;
        await this.saveOutboundMessage(
          subDomain,
          to,
          'text',
          { text },
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending text message: ${error}`);
      throw error;
    }
  }

  /**
   * Send a template message
   */
  static async sendTemplateMessage(
    subDomain: string,
    params: SendTemplateMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, templateName, languageCode = 'en_US', parameters = [] } = params;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          ...(parameters.length > 0 && {
            components: [
              {
                type: 'body',
                parameters: parameters.map((param) => ({
                  type: param.type || 'text',
                  text: param.value || param,
                })),
              },
            ],
          }),
        },
      };

      const response = await this.makeApiCall(
        config.phoneNumberId,
        config.accessToken,
        'messages',
        'POST',
        payload
      );

      // Save outbound message to database
      if (response.messages && response.messages.length > 0) {
        const messageId = response.messages[0].id;
        await this.saveOutboundMessage(
          subDomain,
          to,
          'template',
          {
            template: {
              name: templateName,
              language: languageCode,
              components: parameters.length > 0 ? [{ type: 'body', parameters }] : [],
            },
          },
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending template message: ${error}`);
      throw error;
    }
  }

  /**
   * Send an interactive message (buttons or list)
   */
  static async sendInteractiveMessage(
    subDomain: string,
    params: SendInteractiveMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, type, body, footer, header, action } = params;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type,
          body: {
            text: body,
          },
          ...(footer && { footer: { text: footer } }),
          ...(header && { header }),
          action,
        },
      };

      const response = await this.makeApiCall(
        config.phoneNumberId,
        config.accessToken,
        'messages',
        'POST',
        payload
      );

      // Save outbound message to database
      if (response.messages && response.messages.length > 0) {
        const messageId = response.messages[0].id;
        await this.saveOutboundMessage(
          subDomain,
          to,
          'interactive',
          {
            interactive: {
              type,
              body,
              footer,
              header,
              action,
            },
          },
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending interactive message: ${error}`);
      throw error;
    }
  }

  /**
   * Send a media message (image, audio, video, document)
   */
  static async sendMediaMessage(
    subDomain: string,
    params: SendMediaMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, type, mediaId, mediaUrl, caption, filename } = params;

      if (!mediaId && !mediaUrl) {
        throw new Error('Either mediaId or mediaUrl must be provided');
      }

      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type,
        [type]: {},
      };

      if (mediaId) {
        payload[type].id = mediaId;
      } else if (mediaUrl) {
        payload[type].link = mediaUrl;
      }

      if (caption && (type === 'image' || type === 'video')) {
        payload[type].caption = caption;
      }

      if (filename && type === 'document') {
        payload[type].filename = filename;
      }

      const response = await this.makeApiCall(
        config.phoneNumberId,
        config.accessToken,
        'messages',
        'POST',
        payload
      );

      // Save outbound message to database
      if (response.messages && response.messages.length > 0) {
        const messageId = response.messages[0].id;
        const content: any = {
          mediaUrl: mediaId
            ? `https://graph.facebook.com/${META_API_VERSION}/${mediaId}`
            : mediaUrl,
        };
        // Store caption for images/videos, filename for documents
        // Don't overwrite - preserve both if they exist
        if (caption && (type === 'image' || type === 'video')) {
          content.text = caption;
        }
        if (filename && type === 'document') {
          content.filename = filename;
          // Also include filename as text if no caption was set (for display purposes)
          if (!content.text) {
            content.text = filename;
          }
        }

        await this.saveOutboundMessage(
          subDomain,
          to,
          type,
          content,
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending media message: ${error}`);
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  static async markMessageAsRead(
    subDomain: string,
    messageId: string,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      return await this.makeApiCall(
        config.phoneNumberId,
        config.accessToken,
        'messages',
        'POST',
        payload
      );
    } catch (error) {
      logger.error(`Error marking message as read: ${error}`);
      throw error;
    }
  }

  /**
   * Get message templates
   */
  static async getTemplates(
    subDomain: string,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      return await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        'message_templates',
        'GET'
      );
    } catch (error) {
      logger.error(`Error getting templates: ${error}`);
      throw error;
    }
  }

  /**
   * Get phone numbers
   */
  static async getPhoneNumbers(
    subDomain: string,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      return await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        'phone_numbers',
        'GET'
      );
    } catch (error) {
      logger.error(`Error getting phone numbers: ${error}`);
      throw error;
    }
  }
}

