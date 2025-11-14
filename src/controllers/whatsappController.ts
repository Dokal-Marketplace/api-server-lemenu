import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { whatsappService } from "../services/whatsapp/whatsappService";
import { wahaService } from "../services/whatsapp/wahaService"
import { conversationStateManager } from "../services/conversationStateManager";
import { Business } from "../models/Business";
import { createServerError } from "@/utils/whatsappErrors";





export const resetBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain } = req.params;
    const business = await Business.findOne({ subDomain });
    if (!business) {
      return res.status(404).json({
        type: "3",
        message: "Business not found",
        data: null
      });
    }
    /// update to delete whatsapp config from meta
    business.whatsappAccessToken = undefined;
    business.whatsappTokenExpiresAt = undefined;
    business.whatsappRefreshToken = undefined;
    business.wabaId = undefined;
    business.whatsappPhoneNumberIds = [];
    business.fbPageIds = [];
    business.fbCatalogIds = [];
    business.fbDatasetIds = [];
    business.instagramAccountIds = [];
    business.whatsappPhoneNumberIds = [];
    business.whatsappPhoneNumberIds = [];
    await business.save();
    res.json({
      type: "1",
      message: "WhatsApp config reset successfully",
      data: null
    });
  } catch (error: any) {
    logger.error("Error resetting WhatsApp config:", error);
    next(createServerError(error.message || 'Failed to reset WhatsApp config', error));
  }
};
// Bot Management
export const createBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phoneNumber, subDomain, localId, configuration } = req.body;
    
    const bot = await whatsappService.createBot({
      name,
      phoneNumber,
      subDomain,
      localId,
      configuration
    });

    res.json({
      type: "1",
      message: "WhatsApp bot created successfully",
      data: bot
    });
  } catch (error) {
    logger.error("Error creating WhatsApp bot:", error);
    next(error);
  }
};

export const getBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const bot = await whatsappService.getBot(botId);
    
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Bot retrieved successfully",
      data: bot
    });
  } catch (error) {
    logger.error("Error getting WhatsApp bot:", error);
    next(error);
  }
};

export const getBotBySubDomain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain } = req.params;
    const bot = await whatsappService.getBotBySubDomain(subDomain);
    
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found for subdomain",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Bot retrieved successfully",
      data: bot
    });
  } catch (error) {
    logger.error("Error getting WhatsApp bot by subdomain:", error);
    next(error);
  }
};

export const startBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const result = await whatsappService.startBot(botId);

    res.json({
      type: "1",
      message: "Bot started successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error starting WhatsApp bot:", error);
    next(error);
  }
};

export const stopBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    await whatsappService.stopBot(botId);

    res.json({
      type: "1",
      message: "Bot stopped successfully",
      data: null
    });
  } catch (error) {
    logger.error("Error stopping WhatsApp bot:", error);
    next(error);
  }
};

export const getBotStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const status = await whatsappService.getBotStatus(botId);

    res.json({
      type: "1",
      message: "Bot status retrieved successfully",
      data: status
    });
  } catch (error) {
    logger.error("Error getting bot status:", error);
    next(error);
  }
};

export const getQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const { format = 'raw' } = req.query;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const qrCode = await wahaService.getQRCode(sessionName, format as 'image' | 'raw');

    res.json({
      type: "1",
      message: "QR code retrieved successfully",
      data: { qrCode }
    });
  } catch (error) {
    logger.error("Error getting QR code:", error);
    next(error);
  }
};

// Messaging
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, message } = req.body;
    
    const result = await whatsappService.sendMessage({
      botId,
      to,
      message
    });

    res.json({
      type: "1",
      message: "Message sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending message:", error);
    next(error);
  }
};

export const sendTextMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, text } = req.body;
    
    const result = await whatsappService.sendTextMessage(botId, to, text);

    res.json({
      type: "1",
      message: "Text message sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending text message:", error);
    next(error);
  }
};

export const sendWelcomeMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to } = req.body;
    
    const result = await whatsappService.sendWelcomeMessage(botId, to);

    res.json({
      type: "1",
      message: "Welcome message sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending welcome message:", error);
    next(error);
  }
};

// Webhook
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await whatsappService.handleWebhookEvent(req.body);
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error("Error handling webhook:", error);
    next(error);
  }
};

// Health check
export const healthCheck = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("WhatsApp health endpoint hit");
    res.json({ 
      type: "1",
      message: "WhatsApp service is healthy",
      data: { status: "ok" }
    });
  } catch (error) {
    logger.error("Error with WhatsApp health check");
    next(error);
  }
};

// Conversation Management
export const getConversationState = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const state = await conversationStateManager.getBySessionId(sessionId);
    
    if (!state) {
      return res.status(404).json({
        type: "3",
        message: "Conversation state not found",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Conversation state retrieved successfully",
      data: state
    });
  } catch (error) {
    logger.error("Error getting conversation state:", error);
    next(error);
  }
};

export const getActiveConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const { limit = 100 } = req.query;
    
    const conversations = await whatsappService.getActiveConversations(
      botId,
      parseInt(limit as string)
    );

    res.json({
      type: "1",
      message: "Active conversations retrieved successfully",
      data: conversations
    });
  } catch (error) {
    logger.error("Error getting active conversations:", error);
    next(error);
  }
};

export const updateConversationIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const { intent, step } = req.body;
    
    const state = await whatsappService.updateConversationIntent(sessionId, intent, step);

    if (!state) {
      return res.status(404).json({
        type: "3",
        message: "Conversation state not found",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Conversation intent updated successfully",
      data: state
    });
  } catch (error) {
    logger.error("Error updating conversation intent:", error);
    next(error);
  }
};

export const endConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    await whatsappService.endConversation(sessionId);

    res.json({
      type: "1",
      message: "Conversation ended successfully",
      data: null
    });
  } catch (error) {
    logger.error("Error ending conversation:", error);
    next(error);
  }
};

export const getConversationStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const { days = 7 } = req.query;
    
    const stats = await conversationStateManager.getStatistics(
      botId,
      parseInt(days as string)
    );

    res.json({
      type: "1",
      message: "Conversation statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    logger.error("Error getting conversation statistics:", error);
    next(error);
  }
};

// Order Management
export const createOrderFromConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const orderData = req.body;
    
    const order = await whatsappService.createOrderFromConversation(sessionId, orderData);

    res.json({
      type: "1",
      message: "Order created successfully from conversation",
      data: order
    });
  } catch (error) {
    logger.error("Error creating order from conversation:", error);
    next(error);
  }
};

export const getConversationOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const order = await whatsappService.getOrderByConversation(sessionId);

    if (!order) {
      return res.status(404).json({
        type: "3",
        message: "No active order found for this conversation",
        data: null
      });
    }

    res.json({
      type: "1",
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    logger.error("Error getting conversation order:", error);
    next(error);
  }
};

export const getBotOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId } = req.params;
    const { limit = 50 } = req.query;
    
    const orders = await whatsappService.getBotOrders(botId, parseInt(limit as string));

    res.json({
      type: "1",
      message: "Bot orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    logger.error("Error getting bot orders:", error);
    next(error);
  }
};