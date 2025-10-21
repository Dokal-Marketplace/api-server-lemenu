import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { whatsappService } from "../services/whatsapp/whatsappService";
import { wahaService } from "../services/whatsapp/wahaService";
import { conversationStateManager } from "../services/conversationStateManager";

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

// Compliance and Monitoring
export const getComplianceStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await whatsappService.getComplianceStats();

    res.json({
      type: "1",
      message: "Compliance statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    logger.error("Error getting compliance statistics:", error);
    next(error);
  }
};

export const checkSpamContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;
    const isSpam = await whatsappService.checkSpamContent(text);

    res.json({
      type: "1",
      message: "Spam content check completed",
      data: { isSpam, text }
    });
  } catch (error) {
    logger.error("Error checking spam content:", error);
    next(error);
  }
};

export const getMessageVariations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text, userName } = req.body;
    const variations = await whatsappService.getMessageVariations(text, userName);

    res.json({
      type: "1",
      message: "Message variations generated successfully",
      data: { variations }
    });
  } catch (error) {
    logger.error("Error generating message variations:", error);
    next(error);
  }
};

export const cleanupComplianceData = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await whatsappService.cleanupComplianceData();

    res.json({
      type: "1",
      message: "Compliance data cleanup completed successfully",
      data: null
    });
  } catch (error) {
    logger.error("Error cleaning up compliance data:", error);
    next(error);
  }
};

// Interactive Messages
export const sendButtons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, buttons } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendButtons(sessionName, to, buttons);

    res.json({
      type: "1",
      message: "Buttons sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending buttons:", error);
    next(error);
  }
};

export const sendList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, list } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendList(sessionName, to, list);

    res.json({
      type: "1",
      message: "List sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending list:", error);
    next(error);
  }
};

// Media Messages
export const sendImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, image, caption } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendImage(sessionName, to, image, caption);

    res.json({
      type: "1",
      message: "Image sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending image:", error);
    next(error);
  }
};

export const sendVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, video, caption } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendVideo(sessionName, to, video, caption);

    res.json({
      type: "1",
      message: "Video sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending video:", error);
    next(error);
  }
};

export const sendDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, document, caption } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendDocument(sessionName, to, document, caption);

    res.json({
      type: "1",
      message: "Document sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending document:", error);
    next(error);
  }
};

export const sendVoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, voice } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendVoice(sessionName, to, voice);

    res.json({
      type: "1",
      message: "Voice message sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending voice:", error);
    next(error);
  }
};

// Location and Contact Messages
export const sendLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, location } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendLocation(sessionName, to, location);

    res.json({
      type: "1",
      message: "Location sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending location:", error);
    next(error);
  }
};

export const sendContact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, contact } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendContact(sessionName, to, contact);

    res.json({
      type: "1",
      message: "Contact sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending contact:", error);
    next(error);
  }
};

// Template Messages
export const sendTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, template } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendTemplate(sessionName, to, template);

    res.json({
      type: "1",
      message: "Template sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending template:", error);
    next(error);
  }
};

// Poll Messages
export const sendPoll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, poll } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendPoll(sessionName, to, poll);

    res.json({
      type: "1",
      message: "Poll sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending poll:", error);
    next(error);
  }
};

// Link Preview
export const sendLinkPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { botId, to, text, preview } = req.body;
    
    const bot = await whatsappService.getBot(botId);
    if (!bot) {
      return res.status(404).json({
        type: "3",
        message: "Bot not found",
        data: null
      });
    }

    const sessionName = `${bot.subDomain}_${bot.phoneNumber.replace(/\D/g, '')}`;
    const result = await wahaService.sendLinkPreview(sessionName, to, text, preview);

    res.json({
      type: "1",
      message: "Link preview sent successfully",
      data: result
    });
  } catch (error) {
    logger.error("Error sending link preview:", error);
    next(error);
  }
};