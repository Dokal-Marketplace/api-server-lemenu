import { WhatsAppBot, IWhatsAppBot } from '../../models/WhatsApp';
import { wahaService } from './wahaService';
import { CreateBotParams, SendMessageParams } from '../../types/whatsapp';
import logger from '../../utils/logger';

export class WhatsAppService {
  // Bot Management
  async createBot(params: CreateBotParams): Promise<IWhatsAppBot> {
    try {
      // Create WAHA session
      const sessionName = `${params.subDomain}_${params.phoneNumber.replace(/\D/g, '')}`;
      const wahaSession = await wahaService.createSession(sessionName, {
        metadata: {
          'bot.id': params.name,
          'subdomain': params.subDomain,
          'local.id': params.localId
        }
      });

      // Create bot in database
      const bot = new WhatsAppBot({
        name: params.name,
        phoneNumber: params.phoneNumber,
        status: 'inactive',
        isConnected: false,
        configuration: {
          autoReply: true,
          businessHours: {
            enabled: true,
            schedule: {}
          },
          welcomeMessage: '¡Hola! Bienvenido a nuestro restaurante. ¿En qué puedo ayudarte?',
          offlineMessage: 'Estamos cerrados en este momento. Te responderemos pronto.',
          language: 'es',
          features: {
            menuSharing: true,
            orderTracking: true,
            paymentLinks: false,
            promotions: true,
            customerSupport: true
          },
          integrations: {
            cartaAI: false,
            pos: false,
            delivery: false
          },
          ...params.configuration
        },
        statistics: {
          totalMessages: 0,
          totalOrders: 0,
          totalCustomers: 0,
          conversionRate: 0,
          averageResponseTime: 0,
          messagesThisMonth: 0,
          ordersThisMonth: 0,
          revenueThisMonth: 0
        },
        subDomain: params.subDomain,
        localId: params.localId
      });

      await bot.save();
      logger.info(`WhatsApp bot created: ${bot.name} (${bot.phoneNumber})`);
      return bot;
    } catch (error) {
      logger.error('Error creating WhatsApp bot:', error);
      throw error;
    }
  }

  async getBot(botId: string): Promise<IWhatsAppBot | null> {
    try {
      return await WhatsAppBot.findById(botId);
    } catch (error) {
      logger.error('Error getting WhatsApp bot:', error);
      throw error;
    }
  }

  async getBotBySubDomain(subDomain: string): Promise<IWhatsAppBot | null> {
    try {
      return await WhatsAppBot.findOne({ subDomain, status: { $ne: 'error' } });
    } catch (error) {
      logger.error('Error getting WhatsApp bot by subdomain:', error);
      throw error;
    }
  }

  async startBot(botId: string): Promise<{ qrCode?: string; status: string }> {
    try {
      const bot = await WhatsAppBot.findById(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
      
      // Start WAHA session
      await wahaService.startSession(sessionName);
      
      // Update bot status
      bot.status = 'connecting';
      await bot.save();

      // Get QR code if needed
      const session = await wahaService.getSession(sessionName);
      let qrCode: string | undefined;
      
      if (session.status === 'SCAN_QR_CODE') {
        const qrResponse = await wahaService.getQRCode(sessionName, 'raw');
        qrCode = (qrResponse as { value: string }).value;
        bot.qrCode = qrCode;
        await bot.save();
      }

      return { qrCode, status: session.status };
    } catch (error) {
      logger.error('Error starting WhatsApp bot:', error);
      throw error;
    }
  }

  async stopBot(botId: string): Promise<void> {
    try {
      const bot = await WhatsAppBot.findById(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
      
      // Stop WAHA session
      await wahaService.stopSession(sessionName);
      
      // Update bot status
      bot.status = 'inactive';
      bot.isConnected = false;
      await bot.save();

      logger.info(`WhatsApp bot stopped: ${bot.name}`);
    } catch (error) {
      logger.error('Error stopping WhatsApp bot:', error);
      throw error;
    }
  }

  async getBotStatus(botId: string): Promise<{ status: string; isConnected: boolean; qrCode?: string }> {
    try {
      const bot = await WhatsAppBot.findById(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
      const session = await wahaService.getSession(sessionName);
      
      // Update bot status based on WAHA session
      bot.status = this.mapWahaStatusToBotStatus(session.status);
      bot.isConnected = session.status === 'WORKING';
      
      if (session.status === 'SCAN_QR_CODE') {
        const qrResponse = await wahaService.getQRCode(sessionName, 'raw');
        bot.qrCode = (qrResponse as { value: string }).value;
      }
      
      await bot.save();

      return {
        status: bot.status,
        isConnected: bot.isConnected,
        qrCode: bot.qrCode
      };
    } catch (error) {
      logger.error('Error getting bot status:', error);
      throw error;
    }
  }

  // Messaging
  async sendMessage(params: SendMessageParams): Promise<any> {
    try {
      const bot = await WhatsAppBot.findById(params.botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      if (!bot.isConnected) {
        throw new Error('Bot is not connected');
      }

      const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
      const result = await wahaService.sendMessage(sessionName, params.message);
      
      // Update bot statistics
      bot.statistics.totalMessages += 1;
      bot.statistics.messagesThisMonth += 1;
      await bot.save();

      logger.info(`Message sent via bot ${bot.name} to ${params.to}`);
      return result;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendTextMessage(botId: string, to: string, text: string): Promise<any> {
    return this.sendMessage({
      botId,
      to,
      message: {
        to,
        type: 'text',
        text
      }
    });
  }

  async sendWelcomeMessage(botId: string, to: string): Promise<any> {
    try {
      const bot = await WhatsAppBot.findById(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      return this.sendTextMessage(botId, to, bot.configuration.welcomeMessage);
    } catch (error) {
      logger.error('Error sending welcome message:', error);
      throw error;
    }
  }

  // Webhook handling
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      logger.info('Received WAHA webhook event:', event);

      if (event.event === 'session.status') {
        await this.handleSessionStatusEvent(event);
      } else if (event.event === 'message') {
        await this.handleMessageEvent(event);
      }
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  private async handleSessionStatusEvent(event: any): Promise<void> {
    try {
      const sessionName = event.session;
      const status = event.payload.status;
      
      // Find bot by session name
      const bot = await WhatsAppBot.findOne({
        $or: [
          { name: sessionName },
          { phoneNumber: { $regex: sessionName.replace(/\D/g, '') } }
        ]
      });

      if (bot) {
        bot.status = this.mapWahaStatusToBotStatus(status);
        bot.isConnected = status === 'WORKING';
        
        if (status === 'WORKING' && event.payload.me) {
          bot.lastActivity = new Date();
        }
        
        await bot.save();
        logger.info(`Bot ${bot.name} status updated to ${status}`);
      }
    } catch (error) {
      logger.error('Error handling session status event:', error);
      throw error;
    }
  }

  private async handleMessageEvent(event: any): Promise<void> {
    try {
      // Handle incoming messages
      // This would integrate with your existing chat system
      logger.info('Handling incoming message:', event.payload);
      
      // TODO: Implement message handling logic
      // - Save message to database
      // - Process bot responses
      // - Update chat context
      // - Trigger automations
    } catch (error) {
      logger.error('Error handling message event:', error);
      throw error;
    }
  }

  private mapWahaStatusToBotStatus(wahaStatus: string): IWhatsAppBot['status'] {
    switch (wahaStatus) {
      case 'STOPPED':
        return 'inactive';
      case 'STARTING':
      case 'SCAN_QR_CODE':
        return 'connecting';
      case 'WORKING':
        return 'active';
      case 'FAILED':
        return 'error';
      default:
        return 'inactive';
    }
  }
}

export const whatsappService = new WhatsAppService();