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