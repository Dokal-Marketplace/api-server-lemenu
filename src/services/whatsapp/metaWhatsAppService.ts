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

export interface SendProductMessageParams {
  to: string;
  catalogId: string;
  productRetailerId: string;
  body?: string;
  footer?: string;
  header?: {
    type: 'text' | 'image' | 'video';
    content: string;
  };
}

export interface SendProductListMessageParams {
  to: string;
  catalogId: string;
  sections: Array<{
    title: string;
    productItems: Array<{
      productRetailerId: string;
    }>;
  }>;
  body?: string;
  footer?: string;
  header?: {
    type: 'text' | 'image' | 'video';
    content: string;
  };
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
        logger.error(`Failed to decrypt WhatsApp token for business ${subDomain}. Check logs above for detailed error. Possible causes: encryption key mismatch, corrupted token, or token stored in invalid format.`);
        return null;
      }

      // Validate that the decrypted token looks like a valid Facebook access token
      // Facebook tokens are typically 200-300 chars, contain alphanumeric and special chars, not just hex
      // If token is very long (>400 chars) or looks like hex-only, it might be the encrypted value
      const isLikelyEncryptedValue = decryptedToken.length > 400 || /^[0-9a-fA-F]+$/.test(decryptedToken);
      if (isLikelyEncryptedValue) {
        logger.error(`Decrypted token for business ${subDomain} appears to be encrypted value (length: ${decryptedToken.length}). Decryption may have failed silently. Token format: ${decryptedToken.substring(0, 50)}...`);
        return null;
      }

      // Check if token is expired or expiring soon (1 hour before expiry)
      if (
        businessDoc.whatsappTokenExpiresAt &&
        new Date() > new Date(businessDoc.whatsappTokenExpiresAt.getTime() - 60 * 60 * 1000) // 1 hour before expiry
      ) {
        const isExpired = new Date() > businessDoc.whatsappTokenExpiresAt;
        logger.info(
          `WhatsApp token ${isExpired ? 'expired' : 'expiring soon'} for business ${subDomain}, attempting refresh`
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
    const startTime = Date.now();
    const endpoint = 'oauth/access_token';
    
    try {
      // Build query parameters
      // For token refresh, use fb_exchange_token grant type
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID || '',
        client_secret: process.env.FACEBOOK_APP_SECRET || '',
        fb_exchange_token: currentToken,
      });

      const url = `${META_API_BASE_URL}/${endpoint}?${params.toString()}`;
      const safeUrl = url.replace(currentToken, '***MASKED***').replace(
        process.env.FACEBOOK_APP_SECRET || '', 
        '***MASKED***'
      );

      // Log request
      logger.info('[META API REQUEST]', {
        method: 'GET',
        url: safeUrl,
        endpoint,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(url, {
        method: 'GET',
      });

      const responseTime = Date.now() - startTime;

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
        
        logger.error('[META API ERROR]', {
          method: 'GET',
          url: safeUrl,
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        
        return null;
      }

      // Handle response - can be JSON or URL-encoded
      const contentType = response.headers.get('content-type') || '';
      let responseData: any;
      
      if (contentType.includes('application/json')) {
        // JSON response
        responseData = await response.json();
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
        
        responseData = result;
      }

      // Log success
      const safeResponseData = { ...responseData };
      if (safeResponseData.access_token) {
        safeResponseData.access_token = '***MASKED***';
      }

      logger.info('[META API SUCCESS]', {
        method: 'GET',
        url: safeUrl,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        responseData: safeResponseData,
        timestamp: new Date().toISOString()
      });

      return responseData;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      logger.error('[META API CALL ERROR]', {
        method: 'GET',
        endpoint: 'oauth/access_token',
        responseTime: `${responseTime}ms`,
        error: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      return null;
    }
  }

  /**
   * Exchange Facebook OAuth authorization code for access token
   * POST to https://graph.facebook.com/v24.0/oauth/access_token
   * @param code - Authorization code from Facebook OAuth
   * @param redirectUri - Redirect URI used in OAuth flow
   * @returns Access token response with token and expiration
   */
  static async exchangeAuthorizationCode(
    code: string,
    redirectUri?: string
  ): Promise<{
    access_token: string;
    token_type?: string;
    expires_in?: number;
  } | null> {
    const startTime = Date.now();
    const endpoint = 'oauth/access_token';
    const finalRedirectUri = redirectUri || process.env.FACEBOOK_REDIRECT_URI || '';
    
    // Log function invocation with masked sensitive data
    logger.info('[META API] exchangeAuthorizationCode invoked', {
      endpoint,
      hasCode: !!code,
      codeLength: code?.length || 0,
      redirectUri: finalRedirectUri,
      hasAppId: !!process.env.FACEBOOK_APP_ID,
      hasAppSecret: !!process.env.FACEBOOK_APP_SECRET,
      hasRedirectUri: !!process.env.FACEBOOK_REDIRECT_URI,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Validate required environment variables
      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        logger.error('[META API] Missing required environment variables for token exchange', {
          hasAppId: !!process.env.FACEBOOK_APP_ID,
          hasAppSecret: !!process.env.FACEBOOK_APP_SECRET,
        });
        return null;
      }

      // Validate that redirect URI is available (either from parameter or environment)
      if (!finalRedirectUri) {
        logger.error('[META API] Missing redirect URI for token exchange', {
          providedRedirectUri: !!redirectUri,
          envRedirectUri: !!process.env.FACEBOOK_REDIRECT_URI,
        });
        const missingRedirectError: any = new Error(
          'Redirect URI is required for OAuth token exchange. Please provide redirect_uri in the request or set FACEBOOK_REDIRECT_URI environment variable.'
        );
        missingRedirectError.isMissingRedirectUri = true;
        throw missingRedirectError;
      }

      // Build request parameters
      // Facebook OAuth accepts both GET (query params) and POST (form-urlencoded)
      // Using POST with form-urlencoded as it's more secure for sensitive data
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        code: code,
      });

      // Use v24.0 for OAuth token exchange as per Facebook API requirements
      const url = `https://graph.facebook.com/v24.0/${endpoint}`;
      
      // Create safe params for logging (mask sensitive data)
      const safeParams = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID || '',
        client_secret: '***MASKED***',
        redirect_uri: finalRedirectUri,
        code: '***MASKED***',
      });

      // Log request details
      logger.info('[META API REQUEST]', {
        method: 'POST',
        url,
        endpoint,
        params: safeParams.toString(),
        redirectUri: finalRedirectUri,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errorData: any = {};
        
        if (contentType.includes('application/json')) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text().catch(() => '');
          try {
            const urlParams = new URLSearchParams(text);
            errorData = Object.fromEntries(urlParams);
          } catch {
            errorData = { error: text };
          }
        }
        
        // Extract error details for better logging
        const errorMessage = errorData?.error?.message || errorData?.error?.error_user_msg || errorData?.error_description || 'Unknown error';
        const errorCode = errorData?.error?.code || errorData?.error_code;
        const errorType = errorData?.error?.type || errorData?.error_type;
        const errorSubcode = errorData?.error?.error_subcode;
        
        logger.error('[META API ERROR]', {
          method: 'POST',
          url,
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          error: {
            message: errorMessage,
            code: errorCode,
            type: errorType,
            error_subcode: errorSubcode,
            fullError: errorData
          },
          redirectUri: finalRedirectUri,
          timestamp: new Date().toISOString()
        });
        
        // Check if this is an expired authorization code error
        // Error code 100 with subcode 36007 indicates expired authorization code
        const isExpiredCode = (errorCode === 100 && errorSubcode === 36007) || 
                             (errorCode === 100 && errorMessage?.toLowerCase().includes('expired'));
        
        // Check if this is a redirect URI mismatch error
        // Error code 100 with subcode 36008 indicates redirect URI mismatch
        const isRedirectUriMismatch = (errorCode === 100 && errorSubcode === 36008) ||
                                     (errorCode === 100 && errorMessage?.toLowerCase().includes('redirect_uri'));
        
        if (isExpiredCode) {
          // Throw a specific error for expired codes that can be caught by the controller
          const expiredError: any = new Error('Authorization code has expired. Please re-authenticate to get a new code.');
          expiredError.isExpiredCode = true;
          expiredError.errorCode = errorCode;
          expiredError.errorSubcode = errorSubcode;
          expiredError.metaError = errorData;
          throw expiredError;
        }
        
        if (isRedirectUriMismatch) {
          // Throw a specific error for redirect URI mismatch
          const redirectError: any = new Error(
            `Redirect URI mismatch. The redirect_uri used in the token exchange (${finalRedirectUri}) must exactly match the one used in the OAuth authorization request. Please ensure both use the same redirect URI.`
          );
          redirectError.isRedirectUriMismatch = true;
          redirectError.errorCode = errorCode;
          redirectError.errorSubcode = errorSubcode;
          redirectError.redirectUri = finalRedirectUri;
          redirectError.metaError = errorData;
          throw redirectError;
        }
        
        return null;
      }

      // Handle response - can be JSON or URL-encoded
      const contentType = response.headers.get('content-type') || '';
      let responseData: any;
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // URL-encoded response
        const text = await response.text();
        const urlParams = new URLSearchParams(text);
        
        const result: any = {};
        urlParams.forEach((value, key) => {
          result[key] = value;
        });
        
        if (result.expires_in) {
          result.expires_in = parseInt(result.expires_in, 10);
        }
        
        responseData = result;
      }

      
      // Calculate token expiration date for logging
      const expiresIn = responseData.expires_in || 0;
      const expiresAt = expiresIn > 0 
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

      // Create safe response data for logging (mask token)
      const safeResponseData = { ...responseData };
      if (safeResponseData.access_token) {
        safeResponseData.access_token = '***MASKED***';
        safeResponseData.tokenLength = responseData.access_token.length;
      }

      // Log successful response
      logger.info('[META API SUCCESS]', {
        method: 'POST',
        url,
        endpoint,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        responseSize: JSON.stringify(responseData || {}).length,
        tokenType: responseData.token_type || 'bearer',
        expiresIn: expiresIn,
        expiresAt: expiresAt,
        hasAccessToken: !!responseData.access_token,
        timestamp: new Date().toISOString()
      });

      // Log full response data at debug level (with masked token)
      if (responseData && typeof responseData === 'object') {
        logger.debug('[META API RESPONSE DATA]', {
          endpoint,
          data: safeResponseData
        });
      }

      return responseData;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      logger.error('[META API CALL ERROR]', {
        method: 'POST',
        url: `https://graph.facebook.com/v24.0/${endpoint}`,
        endpoint: 'oauth/access_token',
        responseTime: `${responseTime}ms`,
        error: error.message || String(error),
        errorName: error.name,
        stack: error.stack,
        redirectUri: finalRedirectUri,
        hasCode: !!code,
        timestamp: new Date().toISOString()
      });
      
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

      if (!business.wabaId) {
        logger.error(`No WABA ID configured for business ${subDomain}`);
        return null;
      }

      if (!business.whatsappPhoneNumberIds || business.whatsappPhoneNumberIds.length === 0) {
        logger.error(`No WhatsApp phone number ID configured for business ${subDomain}`);
        return null;
      }
      // Pass business object to avoid duplicate lookup
      const accessToken = await this.getValidAccessToken(subDomain, localId, business);
      if (!accessToken) {
        logger.error(`No valid access token for business ${subDomain}`);
        return null;
      }

      // Use the first phone number ID (can be extended to support multiple)
      const config = {
        phoneNumberId: business.whatsappPhoneNumberIds[0],
        wabaId: business.wabaId,
        accessToken,
      };

      logger.info('[META API] Business config retrieved successfully', {
        subDomain,
        phoneNumberId: config.phoneNumberId,
        wabaId: config.wabaId,
        hasAccessToken: !!config.accessToken
      });

      return config;
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
    const startTime = Date.now();
    const url = `${META_API_BASE_URL}/${phoneNumberId}/${endpoint}`;
    
    logger.info('[META API] makeApiCall invoked', {
      method,
      endpoint,
      phoneNumberId,
      url: url.replace(accessToken, '***MASKED***'),
      hasBody: !!body
    });
    
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      const options: RequestInit = {
        method,
        headers,
      };

      // Prepare body for logging (mask sensitive data)
      let bodyForLogging: any = null;
      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
        // Create a safe copy for logging (mask tokens, passwords, etc.)
        bodyForLogging = JSON.parse(JSON.stringify(body));
        if (bodyForLogging.access_token) bodyForLogging.access_token = '***MASKED***';
        if (bodyForLogging.token) bodyForLogging.token = '***MASKED***';
        if (bodyForLogging.password) bodyForLogging.password = '***MASKED***';
      }

      // Log request details
      logger.info('[META API REQUEST]', {
        method,
        url: url.replace(accessToken, '***MASKED***'),
        endpoint,
        phoneNumberId,
        hasBody: !!body,
        body: bodyForLogging,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      // Get response data
      const contentType = response.headers.get('content-type') || '';
      let responseData: any = null;
      
      if (contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        responseData = text.length > 1000 ? text.substring(0, 1000) + '... (truncated)' : text;
      }

      if (!response.ok) {
        // Log error response
        logger.error('[META API ERROR]', {
          method,
          url: url.replace(accessToken, '***MASKED***'),
          endpoint,
          phoneNumberId,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          error: responseData,
          timestamp: new Date().toISOString()
        });
        
        throw new Error(
          `Meta WhatsApp API error: ${responseData?.error?.message || responseData?.error?.error_user_msg || 'Unknown error'}`
        );
      }

      // Log successful response
      const logResponseData = responseData && typeof responseData === 'object' 
        ? JSON.stringify(responseData).length > 1000 
          ? JSON.stringify(responseData).substring(0, 1000) + '... (truncated)'
          : responseData
        : responseData;

      logger.info('[META API SUCCESS]', {
        method,
        url: url.replace(accessToken, '***MASKED***'),
        endpoint,
        phoneNumberId,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        responseSize: JSON.stringify(responseData || {}).length,
        timestamp: new Date().toISOString()
      });

      // Log full response data at debug level (if needed)
      if (responseData && typeof responseData === 'object') {
        logger.debug('[META API RESPONSE DATA]', {
          endpoint,
          data: logResponseData
        });
      }

      return responseData;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log error details
      logger.error('[META API CALL ERROR]', {
        method,
        url: url.replace(accessToken, '***MASKED***'),
        endpoint,
        phoneNumberId,
        responseTime: `${responseTime}ms`,
        error: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
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
        chatId: (chat as any)._id.toString(),
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
      logger.info('[META API] sendTextMessage called', {
        subDomain,
        to: params.to,
        localId,
        timestamp: new Date().toISOString()
      });

      const config = await this.getBusinessConfig(subDomain, localId);

      if (!config) {
        logger.error('[META API] sendTextMessage failed - business config not found', {
          subDomain,
          to: params.to,
          localId
        });
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

      logger.info('[META API] Making API call for sendTextMessage', {
        subDomain,
        phoneNumberId: config.phoneNumberId,
        endpoint: 'messages',
        to: params.to
      });


      const response = await this.makeApiCall(
        process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
        process.env.WHATSAPP_TOKEN ?? '',
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
   * Send a product message (single product)
   */
  static async sendProductMessage(
    subDomain: string,
    params: SendProductMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, catalogId, productRetailerId, body, footer, header } = params;

      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'product',
          ...(body && { body: { text: body } }),
          ...(footer && { footer: { text: footer } }),
          ...(header && { header }),
          action: {
            catalog_id: catalogId,
            product_retailer_id: productRetailerId,
          },
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
              type: 'product',
              body,
              footer,
              header,
              action: {
                catalogId,
                productRetailerId,
              },
            },
          },
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending product message: ${error}`);
      throw error;
    }
  }

  /**
   * Send a product list message (multiple products)
   */
  static async sendProductListMessage(
    subDomain: string,
    params: SendProductListMessageParams,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const { to, catalogId, sections, body, footer, header } = params;

      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'product_list',
          ...(body && { body: { text: body } }),
          ...(footer && { footer: { text: footer } }),
          ...(header && { header }),
          action: {
            catalog_id: catalogId,
            sections: sections.map((section) => ({
              title: section.title,
              product_items: section.productItems.map((item) => ({
                product_retailer_id: item.productRetailerId,
              })),
            })),
          },
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
              type: 'product_list',
              body,
              footer,
              header,
              action: {
                catalogId,
                sections,
              },
            },
          },
          messageId,
          localId
        );
      }

      return response;
    } catch (error) {
      logger.error(`Error sending product list message: ${error}`);
      throw error;
    }
  }

  /**
   * Check conversation window status for a phone number
   * Returns whether the 24-hour window is open and expiration details
   */
  static async checkConversationWindow(
    subDomain: string,
    phone: string,
    localId?: string
  ): Promise<{
    isOpen: boolean;
    expiresAt?: Date;
    timeRemaining?: number; // milliseconds
    lastMessageTime?: Date;
  }> {
    try {
      const { WhatsAppChat, ChatMessage } = await import('../../models/WhatsApp');

      // Find chat for this phone number
      // Note: Conversation window is typically global per phone/subdomain,
      // but we include localId in query if provided for consistency
      const chatQuery: any = {
        customerPhone: phone,
        subDomain: subDomain.toLowerCase(),
      };
      if (localId) {
        chatQuery.localId = localId;
      }

      const chat = await WhatsAppChat.findOne(chatQuery);

      if (!chat || !chat.lastMessageTime) {
        // No conversation history - window is closed
        return {
          isOpen: false,
        };
      }

      // Check if last message was inbound (from customer)
      // Only inbound messages open the 24-hour window
      const lastInboundMessage = await ChatMessage.findOne({
        chatId: (chat._id as any).toString(),
        direction: 'inbound',
        subDomain: subDomain.toLowerCase(),
      })
        .sort({ timestamp: -1 })
        .limit(1)
        .lean();

      if (!lastInboundMessage) {
        // No inbound messages - window is closed
        return {
          isOpen: false,
          lastMessageTime: chat.lastMessageTime,
        };
      }

      const lastInboundTime = new Date(lastInboundMessage.timestamp);
      const now = new Date();
      const timeSinceLastMessage = now.getTime() - lastInboundTime.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      const isOpen = timeSinceLastMessage < twentyFourHours;
      const expiresAt = new Date(lastInboundTime.getTime() + twentyFourHours);
      const timeRemaining = isOpen ? expiresAt.getTime() - now.getTime() : 0;

      return {
        isOpen,
        expiresAt: isOpen ? expiresAt : undefined,
        timeRemaining: isOpen ? timeRemaining : undefined,
        lastMessageTime: lastInboundTime,
      };
    } catch (error) {
      logger.error(`Error checking conversation window: ${error}`);
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
   * Create a message template
   */
  static async createTemplate(
    subDomain: string,
    templateData: {
      name: string;
      category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
      language: string;
      components: Array<{
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        text?: string;
        buttons?: Array<{
          type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
          text: string;
          url?: string;
          phone_number?: string;
        }>;
      }>;
    },
    localId?: string
  ): Promise<{
    success: boolean;
    templateId?: string;
    error?: string;
    status?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Make sure template name is unique by prefixing with subDomain
      const uniqueName = `${subDomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${templateData.name}`;

      const payload = {
        name: uniqueName,
        category: templateData.category,
        language: templateData.language,
        components: templateData.components,
      };

      const url = `${META_API_BASE_URL}/${config.wabaId}/message_templates`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(`Error creating template: ${JSON.stringify(errorData)}`);
        return {
          success: false,
          error: errorData.error?.message || 'Unknown error',
        };
      }

      const result = await response.json();
      logger.info(`Template created successfully: ${uniqueName}`, {
        templateId: result.id,
        status: result.status,
      });

      return {
        success: true,
        templateId: result.id,
        status: result.status || 'PENDING',
      };
    } catch (error: any) {
      logger.error(`Error creating template: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get template status
   */
  static async getTemplateStatus(
    subDomain: string,
    templateName: string,
    localId?: string
  ): Promise<{
    status?: string;
    error?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const uniqueName = `${subDomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${templateName}`;

      // Get all templates and find the one we're looking for
      const templates = await this.getTemplates(subDomain, localId);
      const template = templates?.data?.find((t: any) => t.name === uniqueName);

      if (!template) {
        return {
          error: 'Template not found',
        };
      }

      return {
        status: template.status,
      };
    } catch (error: any) {
      logger.error(`Error getting template status: ${error}`);
      return {
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Delete a message template
   */
  static async deleteTemplate(
    subDomain: string,
    templateName: string,
    hsmId: string,
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      const url = `${META_API_BASE_URL}/${hsmId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(`Error deleting template: ${JSON.stringify(errorData)}`);
        return {
          success: false,
          error: errorData.error?.message || 'Unknown error',
        };
      }

      logger.info(`Template deleted successfully: ${templateName}`);
      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error deleting template: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
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

  /**
   * Check WhatsApp health status for a business
   * Returns health status, configuration validity, and connectivity
   */
  static async checkHealth(
    subDomain: string,
    localId?: string
  ): Promise<{
    isHealthy: boolean;
    reason?: string;
    details: {
      configured: boolean;
      wabaIdValid: boolean;
      phoneNumberIdValid: boolean;
      accessTokenValid: boolean;
      apiConnectivity: boolean;
    };
  }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      
      if (!business) {
        return {
          isHealthy: false,
          reason: 'Business not found',
          details: {
            configured: false,
            wabaIdValid: false,
            phoneNumberIdValid: false,
            accessTokenValid: false,
            apiConnectivity: false,
          },
        };
      }

      // Check if WhatsApp is configured
      const hasWabaId = !!business.wabaId;
      const hasPhoneNumberIds = !!(business.whatsappPhoneNumberIds && business.whatsappPhoneNumberIds.length > 0);
      const hasAccessToken = !!business.whatsappAccessToken;

      if (!hasWabaId) {
        return {
          isHealthy: false,
          reason: 'WhatsApp WABA ID is not configured',
          details: {
            configured: false,
            wabaIdValid: hasWabaId,
            phoneNumberIdValid: hasPhoneNumberIds,
            accessTokenValid: hasAccessToken,
            apiConnectivity: false,
          },
        };
      }
      if (!hasPhoneNumberIds) {
        return {
          isHealthy: false,
          reason: 'WhatsApp phone number ID is not configured',
          details: {
            configured: false,
            wabaIdValid: hasWabaId,
            phoneNumberIdValid: false,
            accessTokenValid: hasAccessToken,
            apiConnectivity: false,
          },
        };
      }
      if (!hasAccessToken) {
        return {
          isHealthy: false,
          reason: 'WhatsApp Access Token is not configured',
          details: {
            configured: false,
            wabaIdValid: hasWabaId,
            phoneNumberIdValid: hasPhoneNumberIds,
            accessTokenValid: false,
            apiConnectivity: false,
          },
        };
      }

      // Try to get business config (validates token)
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        return {
          isHealthy: false,
          reason: 'Invalid WhatsApp configuration or expired token',
          details: {
            configured: true,
            wabaIdValid: hasWabaId,
            phoneNumberIdValid: hasPhoneNumberIds,
            accessTokenValid: false,
            apiConnectivity: false,
          },
        };
      }

      // Test API connectivity by making a simple API call
      try {
        await this.makeApiCall(
          config.wabaId,
          config.accessToken,
          'phone_numbers',
          'GET'
        );
        
        return {
          isHealthy: true,
          details: {
            configured: true,
            wabaIdValid: true,
            phoneNumberIdValid: true,
            accessTokenValid: true,
            apiConnectivity: true,
          },
        };
      } catch (apiError: any) {
        logger.error(`WhatsApp API connectivity test failed: ${apiError}`);
        return {
          isHealthy: false,
          reason: `API connectivity failed: ${apiError.message || 'Unknown error'}`,
          details: {
            configured: true,
            wabaIdValid: true,
            phoneNumberIdValid: true,
            accessTokenValid: true,
            apiConnectivity: false,
          },
        };
      }
    } catch (error: any) {
      logger.error(`Error checking WhatsApp health: ${error}`);
      return {
        isHealthy: false,
        reason: error.message || 'Unknown error',
        details: {
          configured: false,
          wabaIdValid: false,
          phoneNumberIdValid: false,
          accessTokenValid: false,
          apiConnectivity: false,
        },
      };
    }
  }

  /**
   * Validate WhatsApp setup for a business
   * Checks all required configuration and tests connectivity
   */
  static async validateSetup(
    subDomain: string,
    localId?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    details: {
      wabaId: { present: boolean; valid: boolean };
      phoneNumberIds: { present: boolean; count: number; valid: boolean };
      accessToken: { present: boolean; valid: boolean; expiresAt?: Date };
      apiConnectivity: boolean;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      
      if (!business) {
        errors.push('Business not found');
        return {
          isValid: false,
          errors,
          warnings,
          details: {
            wabaId: { present: false, valid: false },
            phoneNumberIds: { present: false, count: 0, valid: false },
            accessToken: { present: false, valid: false },
            apiConnectivity: false,
          },
        };
      }

      const details = {
        wabaId: { present: !!business.wabaId, valid: false },
        phoneNumberIds: {
          present: !!(business.whatsappPhoneNumberIds && business.whatsappPhoneNumberIds.length > 0),
          count: business.whatsappPhoneNumberIds?.length || 0,
          valid: false,
        },
        accessToken: {
          present: !!business.whatsappAccessToken,
          valid: false,
          expiresAt: business.whatsappTokenExpiresAt,
        },
        apiConnectivity: false,
      };

      // Validate WABA ID
      if (!business.wabaId) {
        errors.push('WhatsApp Business Account ID (wabaId) is missing');
      } else {
        details.wabaId.valid = true;
      }

      // Validate phone number IDs
      if (!business.whatsappPhoneNumberIds || business.whatsappPhoneNumberIds.length === 0) {
        errors.push('WhatsApp phone number IDs are missing');
      } else {
        details.phoneNumberIds.valid = true;
      }

      // Validate access token
      if (!business.whatsappAccessToken) {
        errors.push('WhatsApp access token is missing');
      } else {
        // Try to decrypt and validate token
        try {
          const decryptedToken = (business as any).getDecryptedWhatsAppAccessToken();
          if (decryptedToken) {
            details.accessToken.valid = true;
          } else {
            errors.push('WhatsApp access token is invalid or cannot be decrypted');
          }
        } catch (tokenError) {
          errors.push('WhatsApp access token decryption failed');
        }
      }

      // Check token expiration
      if (business.whatsappTokenExpiresAt) {
        const expiresAt = new Date(business.whatsappTokenExpiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (expiresAt < now) {
          errors.push('WhatsApp access token has expired');
          details.accessToken.valid = false;
        } else if (daysUntilExpiry <= 7) {
          warnings.push(`WhatsApp access token expires in ${daysUntilExpiry} days`);
        }
      }

      // Test API connectivity if basic config is present
      if (details.wabaId.present && details.phoneNumberIds.present && details.accessToken.present) {
        try {
          const config = await this.getBusinessConfig(subDomain, localId);
          if (config) {
            // Test API call
            await this.makeApiCall(
              config.wabaId,
              config.accessToken,
              'phone_numbers',
              'GET'
            );
            details.apiConnectivity = true;
          } else {
            errors.push('Failed to get valid business configuration');
          }
        } catch (apiError: any) {
          errors.push(`API connectivity test failed: ${apiError.message || 'Unknown error'}`);
          details.apiConnectivity = false;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        details,
      };
    } catch (error: any) {
      logger.error(`Error validating WhatsApp setup: ${error}`);
      errors.push(`Validation error: ${error.message || 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        details: {
          wabaId: { present: false, valid: false },
          phoneNumberIds: { present: false, count: 0, valid: false },
          accessToken: { present: false, valid: false },
          apiConnectivity: false,
        },
      };
    }
  }

  /**
   * Validate migration data before executing
   * Checks if new WABA ID and phone number IDs are valid and accessible
   */
  static async validateMigration(
    _subDomain: string,
    newWabaId: string,
    newPhoneNumberIds: string[],
    newAccessToken: string,
    _localId?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    details: {
      newWabaIdValid: boolean;
      newPhoneNumberIdsValid: boolean;
      newAccessTokenValid: boolean;
      apiConnectivity: boolean;
    };
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const details = {
      newWabaIdValid: false,
      newPhoneNumberIdsValid: false,
      newAccessTokenValid: false,
      apiConnectivity: false,
    };

    try {
      // Validate WABA ID format (basic check)
      if (!newWabaId || newWabaId.trim().length === 0) {
        errors.push('New WABA ID is required');
      } else {
        details.newWabaIdValid = true;
      }

      // Validate phone number IDs
      if (!newPhoneNumberIds || newPhoneNumberIds.length === 0) {
        errors.push('At least one phone number ID is required');
      } else {
        details.newPhoneNumberIdsValid = true;
      }

      // Validate access token
      if (!newAccessToken || newAccessToken.trim().length === 0) {
        errors.push('New access token is required');
      } else {
        details.newAccessTokenValid = true;
      }

      // Test API connectivity with new credentials
      if (details.newWabaIdValid && details.newPhoneNumberIdsValid && details.newAccessTokenValid) {
        try {
          // Test by getting phone numbers
          await this.makeApiCall(
            newWabaId,
            newAccessToken,
            'phone_numbers',
            'GET'
          );
          details.apiConnectivity = true;
        } catch (apiError: any) {
          errors.push(`API connectivity test failed: ${apiError.message || 'Unknown error'}`);
          details.apiConnectivity = false;
        }
      }

      // Check if phone number IDs belong to the WABA
      if (details.apiConnectivity) {
        try {
          const phoneNumbers = await this.makeApiCall(
            newWabaId,
            newAccessToken,
            'phone_numbers',
            'GET'
          );
          
          const availablePhoneNumberIds = phoneNumbers?.data?.map((pn: any) => pn.id) || [];
          const missingIds = newPhoneNumberIds.filter(id => !availablePhoneNumberIds.includes(id));
          
          if (missingIds.length > 0) {
            errors.push(`Phone number IDs not found in WABA: ${missingIds.join(', ')}`);
            details.newPhoneNumberIdsValid = false;
          }
        } catch (error: any) {
          warnings.push(`Could not verify phone number IDs belong to WABA: ${error.message}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        details,
      };
    } catch (error: any) {
      logger.error(`Error validating migration: ${error}`);
      errors.push(`Validation error: ${error.message || 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings,
        details,
      };
    }
  }

  /**
   * Execute WhatsApp migration
   * Migrates phone numbers from one WABA to another
   */
  static async executeMigration(
    subDomain: string,
    migrationData: {
      newWabaId: string;
      newPhoneNumberIds: string[];
      newAccessToken: string;
      newTokenExpiresAt?: Date;
      migratedBy?: string;
    },
    localId?: string
  ): Promise<{
    success: boolean;
    migrationId?: string;
    error?: string;
  }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Validate migration first
      const validation = await this.validateMigration(
        subDomain,
        migrationData.newWabaId,
        migrationData.newPhoneNumberIds,
        migrationData.newAccessToken,
        localId
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: `Migration validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Store old values for rollback
      const oldWabaId = business.wabaId;
      const oldPhoneNumberIds = business.whatsappPhoneNumberIds || [];
      // Note: oldAccessToken stored for reference but cannot be restored (encrypted)
      // const oldAccessToken = business.whatsappAccessToken;

      // Create migration record
      const migrationRecord = {
        oldWabaId,
        newWabaId: migrationData.newWabaId,
        oldPhoneNumberIds,
        newPhoneNumberIds: migrationData.newPhoneNumberIds,
        migratedAt: new Date(),
        migratedBy: migrationData.migratedBy,
        status: 'pending' as const,
        validationResults: validation,
      };

      // Add to migration history
      if (!business.whatsappMigrationHistory) {
        business.whatsappMigrationHistory = [];
      }
      business.whatsappMigrationHistory.push(migrationRecord);
      const migrationId = (business.whatsappMigrationHistory.length - 1).toString();

      try {
        // Update business with new WhatsApp configuration
        business.wabaId = migrationData.newWabaId;
        business.whatsappPhoneNumberIds = migrationData.newPhoneNumberIds;
        business.whatsappAccessToken = migrationData.newAccessToken; // Will be encrypted by pre-save middleware
        if (migrationData.newTokenExpiresAt) {
          business.whatsappTokenExpiresAt = migrationData.newTokenExpiresAt;
        }
        // Enable WhatsApp when credentials are set
        business.whatsappEnabled = true;

        await business.save();

        // Auto-provision templates if not already provisioned
        if (!business.templatesProvisioned && business.wabaId) {
          try {
            const { templateProvisioningService } = await import('./templateProvisioningService');
            logger.info(`Auto-provisioning templates for business ${subDomain} after migration`);
            const provisionResult = await templateProvisioningService.provisionTemplates(subDomain, 'es_PE', localId);
            
            // Update business with template tracking
            business.templatesProvisioned = provisionResult.success;
            business.templatesProvisionedAt = new Date();
            if (!business.whatsappTemplates) {
              business.whatsappTemplates = [];
            }
            provisionResult.results.forEach((templateResult) => {
              const existingIndex = business.whatsappTemplates!.findIndex(
                (t: any) => t.name === templateResult.templateName
              );
              if (existingIndex >= 0) {
                business.whatsappTemplates![existingIndex] = {
                  name: templateResult.templateName,
                  templateId: templateResult.templateId,
                  status: (templateResult.status as any) || 'PENDING',
                  createdAt: business.whatsappTemplates![existingIndex].createdAt,
                  approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
                  language: 'es_PE',
                  category: 'UTILITY',
                };
              } else {
                business.whatsappTemplates!.push({
                  name: templateResult.templateName,
                  templateId: templateResult.templateId,
                  status: (templateResult.status as any) || 'PENDING',
                  createdAt: new Date(),
                  approvedAt: templateResult.status === 'APPROVED' ? new Date() : undefined,
                  language: 'es_PE',
                  category: 'UTILITY',
                });
              }
            });
            await business.save();
          } catch (templateError: any) {
            logger.warn(`Template auto-provisioning failed after migration: ${templateError.message}`);
            // Don't fail migration if template provisioning fails
          }
        }

        // Update migration status to completed
        if (business.whatsappMigrationHistory && business.whatsappMigrationHistory.length > 0) {
          const lastMigration = business.whatsappMigrationHistory[business.whatsappMigrationHistory.length - 1];
          lastMigration.status = 'completed';
          await business.save();
        }

        logger.info(`WhatsApp migration completed for business ${subDomain}`, {
          oldWabaId,
          newWabaId: migrationData.newWabaId,
        });

        return {
          success: true,
          migrationId,
        };
      } catch (saveError: any) {
        // Mark migration as failed
        if (business.whatsappMigrationHistory && business.whatsappMigrationHistory.length > 0) {
          const lastMigration = business.whatsappMigrationHistory[business.whatsappMigrationHistory.length - 1];
          lastMigration.status = 'failed';
          lastMigration.error = saveError.message;
          await business.save();
        }

        throw saveError;
      }
    } catch (error: any) {
      logger.error(`Error executing migration: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error during migration',
      };
    }
  }

  /**
   * Get migration status
   */
  static async getMigrationStatus(
    subDomain: string,
    localId?: string
  ): Promise<{
    hasActiveMigration: boolean;
    lastMigration?: any;
    migrationHistory: any[];
  }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      if (!business) {
        throw new Error('Business not found');
      }

      const history = business.whatsappMigrationHistory || [];
      const lastMigration = history.length > 0 ? history[history.length - 1] : null;
      const hasActiveMigration = lastMigration && lastMigration.status === 'pending';

      return {
        hasActiveMigration: !!hasActiveMigration,
        lastMigration,
        migrationHistory: history,
      };
    } catch (error: any) {
      logger.error(`Error getting migration status: ${error}`);
      throw error;
    }
  }

  /**
   * Rollback migration
   */
  static async rollbackMigration(
    subDomain: string,
    migrationId: string,
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      if (!business) {
        throw new Error('Business not found');
      }

      const history = business.whatsappMigrationHistory || [];
      const migrationIndex = parseInt(migrationId, 10);

      if (isNaN(migrationIndex) || migrationIndex < 0 || migrationIndex >= history.length) {
        return {
          success: false,
          error: 'Invalid migration ID',
        };
      }

      const migration = history[migrationIndex];
      if (!migration.oldWabaId || !migration.oldPhoneNumberIds) {
        return {
          success: false,
          error: 'Cannot rollback: old configuration not available',
        };
      }

      // Restore old configuration
      business.wabaId = migration.oldWabaId;
      business.whatsappPhoneNumberIds = migration.oldPhoneNumberIds;
      // Note: We can't restore the old access token as it's encrypted
      // The user will need to provide it or it needs to be stored separately

      // Mark migration as rolled back
      migration.status = 'rolled_back';
      migration.migratedAt = new Date();

      await business.save();

      logger.info(`WhatsApp migration rolled back for business ${subDomain}`, {
        migrationId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error rolling back migration: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error during rollback',
      };
    }
  }

  /**
   * Get account status and information
   */
  static async getAccountStatus(
    subDomain: string,
    localId?: string
  ): Promise<{
    wabaId: string | null;
    phoneNumberIds: string[];
    accountStatus: 'configured' | 'not_configured' | 'invalid';
    health: any;
    tokenExpiresAt?: Date;
    daysUntilTokenExpiry?: number;
  }> {
    try {
      const business = await this.getBusinessBySubDomain(subDomain, localId);
      if (!business) {
        throw new Error('Business not found');
      }

      const health = await this.checkHealth(subDomain, localId);
      
      let accountStatus: 'configured' | 'not_configured' | 'invalid' = 'not_configured';
      if (business.wabaId && business.whatsappPhoneNumberIds && business.whatsappPhoneNumberIds.length > 0) {
        accountStatus = health.isHealthy ? 'configured' : 'invalid';
      }

      let daysUntilTokenExpiry: number | undefined;
      if (business.whatsappTokenExpiresAt) {
        const expiresAt = new Date(business.whatsappTokenExpiresAt);
        const now = new Date();
        daysUntilTokenExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        wabaId: business.wabaId || null,
        phoneNumberIds: business.whatsappPhoneNumberIds || [],
        accountStatus,
        health,
        tokenExpiresAt: business.whatsappTokenExpiresAt || undefined,
        daysUntilTokenExpiry,
      };
    } catch (error: any) {
      logger.error(`Error getting account status: ${error}`);
      throw error;
    }
  }

  /**
   * Get phone number details
   */
  static async getPhoneNumberDetails(
    phoneNumberId: string,
    subDomain: string,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Verify phone number belongs to this business
      if (!config.phoneNumberId || config.phoneNumberId !== phoneNumberId) {
        // Check if phone number ID is in the business's phone number IDs array
        const business = await this.getBusinessBySubDomain(subDomain, localId);
        if (!business?.whatsappPhoneNumberIds?.includes(phoneNumberId)) {
          throw new Error('Phone number ID does not belong to this business');
        }
      }

      // Get phone number details - use phone number ID directly
      const url = `${META_API_BASE_URL}/${phoneNumberId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      return await response.json();
    } catch (error) {
      logger.error(`Error getting phone number details: ${error}`);
      throw error;
    }
  }

  /**
   * Check two-step verification status for a phone number
   */
  static async checkTwoStepVerification(
    phoneNumberId: string,
    subDomain: string,
    localId?: string
  ): Promise<{
    enabled: boolean;
    pinSet: boolean;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Verify phone number belongs to this business
      if (!config.phoneNumberId || config.phoneNumberId !== phoneNumberId) {
        // Check if phone number ID is in the business's phone number IDs array
        const business = await this.getBusinessBySubDomain(subDomain, localId);

        // Add detailed logging to debug the issue
        logger.info('[checkTwoStepVerification] Business data check', {
          phoneNumberId,
          subDomain,
          localId,
          hasBusinessData: !!business,
          whatsappPhoneNumberIds: business?.whatsappPhoneNumberIds,
          wabaId: business?.wabaId,
          phoneNumberIdType: typeof phoneNumberId,
          phoneNumberIdsType: business?.whatsappPhoneNumberIds?.map((id: string) => typeof id)
        });

        if (!business?.whatsappPhoneNumberIds?.includes(phoneNumberId)) {
          logger.error('[checkTwoStepVerification] Phone number ID verification failed', {
            phoneNumberId,
            availablePhoneNumberIds: business?.whatsappPhoneNumberIds,
            businessWabaId: business?.wabaId
          });
          throw new Error('Phone number ID does not belong to this business');
        }
      }

      // Get phone number details which includes two-step verification status
      const url = `${META_API_BASE_URL}/${phoneNumberId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const phoneNumberDetails = await response.json();

      return {
        enabled: phoneNumberDetails?.two_step_verification?.enabled || false,
        pinSet: phoneNumberDetails?.two_step_verification?.pin_set || false,
      };
    } catch (error) {
      logger.error(`Error checking two-step verification: ${error}`);
      throw error;
    }
  }

  /**
   * Disable two-step verification for a phone number
   * Required before phone number migration
   */
  static async disableTwoStepVerification(
    phoneNumberId: string,
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Verify phone number belongs to this business
      if (!config.phoneNumberId || config.phoneNumberId !== phoneNumberId) {
        // Check if phone number ID is in the business's phone number IDs array
        const business = await this.getBusinessBySubDomain(subDomain, localId);
        if (!business?.whatsappPhoneNumberIds?.includes(phoneNumberId)) {
          throw new Error('Phone number ID does not belong to this business');
        }
      }

      // Disable two-step verification
      // Note: This endpoint may require special permissions
      const url = `${META_API_BASE_URL}/${phoneNumberId}/two_step_verification`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: '', // Empty pin to disable
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      logger.info(`Two-step verification disabled for phone number ${phoneNumberId}`);

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error disabling two-step verification: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Verify phone number
   */
  static async verifyPhoneNumber(
    phoneNumberId: string,
    method: 'SMS' | 'VOICE',
    subDomain: string,
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Verify phone number belongs to this business
      if (!config.phoneNumberId || config.phoneNumberId !== phoneNumberId) {
        // Check if phone number ID is in the business's phone number IDs array
        const business = await this.getBusinessBySubDomain(subDomain, localId);
        if (!business?.whatsappPhoneNumberIds?.includes(phoneNumberId)) {
          throw new Error('Phone number ID does not belong to this business');
        }
      }

      // Request verification code
      const url = `${META_API_BASE_URL}/${phoneNumberId}/request_code`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code_method: method.toLowerCase(),
          language: 'en',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      logger.info(`Verification code requested for phone number ${phoneNumberId} via ${method}`);

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error verifying phone number: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get webhook subscriptions for a WABA
   *
   * IMPORTANT: According to Meta's official documentation, the GET /<WABA_ID>/subscribed_apps
   * endpoint only returns which APPS are subscribed, NOT which webhook fields they're subscribed to.
   *
   * Response format from Meta:
   * {
   *   "data": [{
   *     "whatsapp_business_api_data": {
   *       "id": "app_id",
   *       "link": "https://...",
   *       "name": "App Name"
   *     }
   *   }]
   * }
   *
   * The subscribed_fields are NOT included in this endpoint's response.
   * Webhook fields must be configured in the Facebook App Dashboard:
   * App Dashboard > Webhooks > Edit Subscription
   *
   * @see https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-webhooks
   */
  static async getWebhookSubscriptions(
    subDomain: string,
    localId?: string
  ): Promise<any> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Get subscribed apps (webhooks)
      const rawResponse = await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        'subscribed_apps',
        'GET'
      );

      // Log the actual response structure for debugging
      logger.info('[WEBHOOK SUBSCRIPTIONS] Raw Meta API response', {
        subDomain,
        wabaId: config.wabaId,
        responseType: typeof rawResponse,
        responseKeys: rawResponse ? Object.keys(rawResponse) : [],
        hasData: !!rawResponse?.data,
        dataLength: rawResponse?.data?.length,
        fullResponse: JSON.stringify(rawResponse).substring(0, 1000)
      });

      // According to Meta docs, response format is:
      // { data: [{ whatsapp_business_api_data: { id, link, name } }] }
      // NOTE: subscribed_fields is NOT included in this response!

      if (rawResponse?.data && Array.isArray(rawResponse.data)) {
        // Transform Meta's format to a more usable structure
        const transformedData = rawResponse.data.map((item: any) => {
          if (item.whatsapp_business_api_data) {
            return {
              id: item.whatsapp_business_api_data.id,
              name: item.whatsapp_business_api_data.name,
              link: item.whatsapp_business_api_data.link,
              // Note: subscribed_fields is NOT available from this endpoint
              // It must be configured in App Dashboard > Webhooks
              subscribed_fields: null, // Explicitly null to indicate unavailable
              _note: 'Webhook fields must be configured in Facebook App Dashboard > Webhooks > Edit Subscription'
            };
          }
          return item;
        });

        logger.info('[WEBHOOK SUBSCRIPTIONS] Transformed Meta response', {
          appCount: transformedData.length,
          apps: transformedData.map((app: any) => ({
            id: app.id,
            name: app.name
          }))
        });

        return {
          data: transformedData,
          _meta: {
            important: 'subscribed_fields are NOT available via this API endpoint',
            configuration: 'Configure webhook fields in Facebook App Dashboard > Webhooks > Edit Subscription',
            documentation: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-webhooks'
          }
        };
      } else {
        // Unknown format - log and return as is
        logger.warn('[WEBHOOK SUBSCRIPTIONS] Unexpected response format', {
          response: rawResponse
        });
        return rawResponse;
      }
    } catch (error) {
      logger.error('[WEBHOOK SUBSCRIPTIONS] Error getting webhook subscriptions', {
        error: error instanceof Error ? error.message : String(error),
        subDomain
      });
      throw error;
    }
  }

  /**
   * Subscribe to webhooks
   */
  static async subscribeWebhook(
    subDomain: string,
    webhookUrl: string,
    verifyToken: string,
    fields: string[],
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Service-level validation: Ensure fields is not empty
      if (!Array.isArray(fields) || fields.length === 0) {
        const error = 'Fields array cannot be empty. At least one webhook field is required.';
        logger.error('[WEBHOOK SUBSCRIPTION] Validation failed', {
          subDomain,
          error,
          providedFields: fields
        });
        return {
          success: false,
          error,
        };
      }

      // Service-level validation: Ensure all fields are strings
      const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
      if (invalidFields.length > 0) {
        const error = `All fields must be non-empty strings. Invalid: ${JSON.stringify(invalidFields)}`;
        logger.error('[WEBHOOK SUBSCRIPTION] Invalid field types', {
          subDomain,
          invalidFields
        });
        return {
          success: false,
          error,
        };
      }

      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Subscribe app to webhooks
      await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        'subscribed_apps',
        'POST',
        {
          subscribed_fields: fields,
          callback_url: webhookUrl,
          verify_token: verifyToken,
        }
      );

      logger.info(`[WEBHOOK SUBSCRIPTION] Webhook subscription created for WABA ${config.wabaId}`, {
        subDomain,
        fields,
        fieldCount: fields.length
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`[WEBHOOK SUBSCRIPTION] Error subscribing to webhooks`, {
        error: error.message,
        subDomain,
        fields
      });
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Update webhook subscription
   */
  static async updateWebhookSubscription(
    subDomain: string,
    fields: string[],
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Service-level validation: Ensure fields is not empty
      if (!Array.isArray(fields) || fields.length === 0) {
        const error = 'Fields array cannot be empty. At least one webhook field is required. ' +
          'To unsubscribe completely, use the delete webhook subscription endpoint instead.';
        logger.error('[WEBHOOK UPDATE] Validation failed', {
          subDomain,
          error,
          providedFields: fields
        });
        return {
          success: false,
          error,
        };
      }

      // Service-level validation: Ensure all fields are strings
      const invalidFields = fields.filter(f => typeof f !== 'string' || f.trim() === '');
      if (invalidFields.length > 0) {
        const error = `All fields must be non-empty strings. Invalid: ${JSON.stringify(invalidFields)}`;
        logger.error('[WEBHOOK UPDATE] Invalid field types', {
          subDomain,
          invalidFields
        });
        return {
          success: false,
          error,
        };
      }

      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Update subscribed fields
      await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        'subscribed_apps',
        'POST',
        {
          subscribed_fields: fields,
        }
      );

      logger.info(`[WEBHOOK UPDATE] Webhook subscription updated for WABA ${config.wabaId}`, {
        subDomain,
        fields,
        fieldCount: fields.length
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`[WEBHOOK UPDATE] Error updating webhook subscription`, {
        error: error.message,
        subDomain,
        fields
      });
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Delete webhook subscription
   */
  static async deleteWebhookSubscription(
    subDomain: string,
    appId: string,
    localId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const config = await this.getBusinessConfig(subDomain, localId);
      if (!config) {
        throw new Error('Business configuration not found or invalid');
      }

      // Delete webhook subscription
      await this.makeApiCall(
        config.wabaId,
        config.accessToken,
        `subscribed_apps`,
        'DELETE'
      );

      logger.info(`Webhook subscription deleted for WABA ${config.wabaId}`, {
        appId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error(`Error deleting webhook subscription: ${error}`);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

