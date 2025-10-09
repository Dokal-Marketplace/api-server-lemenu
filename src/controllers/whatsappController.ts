import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { whatsappService } from "../services/whatsapp/whatsappService";
import { wahaService } from "../services/whatsapp/wahaService";

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