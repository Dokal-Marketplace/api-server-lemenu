import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import logger from '../../utils/logger';
import { WahaSessionConfig, WahaSession, WahaMessage } from '../../types/whatsapp';



class WahaService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.waha.baseUrl,
      headers: {
        'X-Api-Key': config.waha.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config: any) => {
        logger.info(`WAHA API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        logger.error('WAHA API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: any) => {
        logger.info(`WAHA API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        logger.error('WAHA API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Session Management
  async createSession(sessionName: string, sessionConfig?: WahaSessionConfig): Promise<WahaSession> {
    try {
      const response = await this.client.post('/api/sessions', {
        name: sessionName,
        config: {
          webhooks: [{
            url: config.waha.webhookUrl,
            events: ['message', 'session.status']
          }],
          ...sessionConfig
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating WAHA session:', error);
      throw error;
    }
  }

  async getSession(sessionName: string): Promise<WahaSession> {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting WAHA session:', error);
      throw error;
    }
  }

  async listSessions(all: boolean = false): Promise<WahaSession[]> {
    try {
      const response = await this.client.get(`/api/sessions${all ? '?all=true' : ''}`);
      return response.data;
    } catch (error) {
      logger.error('Error listing WAHA sessions:', error);
      throw error;
    }
  }

  async startSession(sessionName: string): Promise<void> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/start`);
    } catch (error) {
      logger.error('Error starting WAHA session:', error);
      throw error;
    }
  }

  async stopSession(sessionName: string): Promise<void> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/stop`);
    } catch (error) {
      logger.error('Error stopping WAHA session:', error);
      throw error;
    }
  }

  async restartSession(sessionName: string): Promise<void> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/restart`);
    } catch (error) {
      logger.error('Error restarting WAHA session:', error);
      throw error;
    }
  }

  async logoutSession(sessionName: string): Promise<void> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/logout`);
    } catch (error) {
      logger.error('Error logging out WAHA session:', error);
      throw error;
    }
  }

  async deleteSession(sessionName: string): Promise<void> {
    try {
      await this.client.delete(`/api/sessions/${sessionName}`);
    } catch (error) {
      logger.error('Error deleting WAHA session:', error);
      throw error;
    }
  }

  // Authentication
  async getQRCode(sessionName: string, format: 'image' | 'raw' = 'image'): Promise<string | { value: string }> {
    try {
      const response = await this.client.get(`/api/${sessionName}/auth/qr?format=${format}`, {
        headers: {
          'Accept': format === 'image' ? 'image/png' : 'application/json'
        }
      });
      
      if (format === 'image') {
        return response.data;
      } else {
        return response.data;
      }
    } catch (error) {
      logger.error('Error getting QR code:', error);
      throw error;
    }
  }

  async requestPairingCode(sessionName: string, phoneNumber: string): Promise<{ code: string }> {
    try {
      const response = await this.client.post(`/api/${sessionName}/auth/request-code`, {
        phoneNumber
      });
      return response.data;
    } catch (error) {
      logger.error('Error requesting pairing code:', error);
      throw error;
    }
  }

  async getSessionInfo(sessionName: string): Promise<{ id: string; pushName: string } | null> {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}/me`);
      return response.data;
    } catch (error) {
      logger.error('Error getting session info:', error);
      throw error;
    }
  }

  // Messaging
  async sendMessage(sessionName: string, message: WahaMessage): Promise<any> {
       try {
         let endpoint = `/api/${sessionName}/messages`;
         switch (message.type) {
           case 'text':
             endpoint += '/text';
             break;
           case 'image':
           case 'audio':
           case 'video':
           case 'document':
             endpoint += '/media';
             break;
           case 'interactive':
             endpoint += '/interactive';
             break;
           case 'template':
             endpoint += '/template';
             break;
           default:
             endpoint += '/text';
         }
         const response = await this.client.post(endpoint, message);
         return response.data;
       } catch (error) {
         logger.error('Error sending message:', error);
         throw error;
       }
     }

  async sendTextMessage(sessionName: string, to: string, text: string): Promise<any> {
    return this.sendMessage(sessionName, {
      to,
      type: 'text',
      text
    });
  }

  async sendMediaMessage(sessionName: string, to: string, mediaUrl: string, caption?: string): Promise<any> {
    return this.sendMessage(sessionName, {
      to,
      type: 'image',
      text: caption,
      media: {
        url: mediaUrl
      }
    });
  }

  async sendInteractiveMessage(sessionName: string, to: string, interactive: WahaMessage['interactive']): Promise<any> {
    return this.sendMessage(sessionName, {
      to,
      type: 'interactive',
      interactive
    });
  }

  async sendTemplateMessage(sessionName: string, to: string, template: WahaMessage['template']): Promise<any> {
    return this.sendMessage(sessionName, {
      to,
      type: 'template',
      template
    });
  }

  // Interactive Messages
  async sendButtons(sessionName: string, chatId: string, buttons: Array<{
    text: string;
    id: string;
    type?: 'reply' | 'url' | 'call' | 'copy';
    url?: string;
    phoneNumber?: string;
    copyCode?: string;
  }>): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendButtons`, {
        session: sessionName,
        chatId,
        header: 'Choose an option',
        body: 'Please select one of the options below:',
        footer: 'Powered by LeMenu',
        buttons: buttons.map(btn => ({
          text: btn.text,
          id: btn.id,
          type: btn.type || 'reply',
          url: btn.url,
          phoneNumber: btn.phoneNumber,
          copyCode: btn.copyCode
        }))
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending buttons:', error);
      throw error;
    }
  }

  async sendList(sessionName: string, chatId: string, list: {
    title: string;
    description: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendList`, {
        session: sessionName,
        chatId,
        message: {
          title: list.title,
          description: list.description,
          footer: 'Powered by LeMenu',
          button: list.buttonText,
          sections: list.sections
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending list:', error);
      throw error;
    }
  }

  // Media Messages
  async sendImage(sessionName: string, chatId: string, image: {
    url?: string;
    filename?: string;
    mimetype?: string;
    data?: string; // base64
  }, caption?: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendImage`, {
        session: sessionName,
        chatId,
        file: image,
        caption
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending image:', error);
      throw error;
    }
  }

  async sendVideo(sessionName: string, chatId: string, video: {
    url?: string;
    filename?: string;
    mimetype?: string;
    data?: string; // base64
  }, caption?: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendVideo`, {
        session: sessionName,
        chatId,
        file: video,
        caption
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending video:', error);
      throw error;
    }
  }

  async sendDocument(sessionName: string, chatId: string, document: {
    url?: string;
    filename?: string;
    mimetype?: string;
    data?: string; // base64
  }, caption?: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendFile`, {
        session: sessionName,
        chatId,
        file: document,
        caption
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending document:', error);
      throw error;
    }
  }

  async sendVoice(sessionName: string, chatId: string, voice: {
    url?: string;
    filename?: string;
    mimetype?: string;
    data?: string; // base64
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendVoice`, {
        session: sessionName,
        chatId,
        file: voice
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending voice:', error);
      throw error;
    }
  }

  // Location and Contact Messages
  async sendLocation(sessionName: string, chatId: string, location: {
    latitude: number;
    longitude: number;
    title?: string;
    address?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendLocation`, {
        session: sessionName,
        chatId,
        latitude: location.latitude,
        longitude: location.longitude,
        title: location.title || 'Location',
        address: location.address
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending location:', error);
      throw error;
    }
  }

  async sendContact(sessionName: string, chatId: string, contact: {
    fullName: string;
    phoneNumber: string;
    organization?: string;
    vcard?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendContactVcard`, {
        session: sessionName,
        chatId,
        contacts: [{
          fullName: contact.fullName,
          phoneNumber: contact.phoneNumber,
          organization: contact.organization,
          vcard: contact.vcard
        }]
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending contact:', error);
      throw error;
    }
  }

  // Template Messages
  async sendTemplate(sessionName: string, chatId: string, template: {
    name: string;
    language: string;
    components?: Array<{
      type: 'header' | 'body' | 'footer' | 'button';
      parameters?: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
        image?: {
          link: string;
        };
        document?: {
          link: string;
          filename: string;
        };
      }>;
    }>;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendTemplate`, {
        session: sessionName,
        chatId,
        template
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending template:', error);
      throw error;
    }
  }

  // Poll Messages
  async sendPoll(sessionName: string, chatId: string, poll: {
    name: string;
    options: string[];
    multipleAnswers?: boolean;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendPoll`, {
        session: sessionName,
        chatId,
        poll
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending poll:', error);
      throw error;
    }
  }

  // Link Preview
  async sendLinkPreview(sessionName: string, chatId: string, text: string, preview: {
    url: string;
    title: string;
    description: string;
    image?: {
      url?: string;
      data?: string;
    };
  }): Promise<any> {
    try {
      const response = await this.client.post(`/api/sendLinkPreview`, {
        session: sessionName,
        chatId,
        text,
        preview
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending link preview:', error);
      throw error;
    }
  }

  // Message Status and Typing Indicators (Compliance Features)
  async sendSeen(sessionName: string, chatId: string, messageId: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/${sessionName}/sendSeen`, {
        chatId,
        messageId
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending seen confirmation:', error);
      throw error;
    }
  }

  async startTyping(sessionName: string, chatId: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/${sessionName}/startTyping`, {
        chatId
      });
      return response.data;
    } catch (error) {
      logger.error('Error starting typing indicator:', error);
      throw error;
    }
  }

  async stopTyping(sessionName: string, chatId: string): Promise<any> {
    try {
      const response = await this.client.post(`/api/${sessionName}/stopTyping`, {
        chatId
      });
      return response.data;
    } catch (error) {
      logger.error('Error stopping typing indicator:', error);
      throw error;
    }
  }

  // Screenshot
  async getScreenshot(sessionName: string, format: 'binary' | 'base64' = 'binary'): Promise<Buffer | { mimetype: string; data: string }> {
    try {
      const response = await this.client.get(`/api/screenshot?session=${sessionName}`, {
        headers: {
          'Accept': format === 'binary' ? 'image/png' : 'application/json'
        },
        responseType: format === 'binary' ? 'arraybuffer' : 'json'
      });
      
      if (format === 'binary') {
        return Buffer.from(response.data);
      } else {
        return response.data;
      }
    } catch (error) {
      logger.error('Error getting screenshot:', error);
      throw error;
    }
  }
}

export const wahaService = new WahaService();