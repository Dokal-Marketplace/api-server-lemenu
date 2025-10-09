import { WhatsAppBot, IWhatsAppBot } from '../../models/WhatsApp';
import { wahaService } from './wahaService';
import { CreateBotParams, SendMessageParams } from '../../types/whatsapp';
import { conversationStateManager, ConversationIntent } from '../conversationStateManager';
import { Order, IOrder } from '../../models/Order';
import logger from '../../utils/logger';

export class WhatsAppService {
  // Bot Management
  async createBot(params: CreateBotParams): Promise<IWhatsAppBot> {
    try {
      // Create WAHA session
      const sessionName = `${params.subDomain}_${params.phoneNumber.replace(/\D/g, '')}`;
      await wahaService.createSession(sessionName, {
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
      // Handle incoming messages with conversation state
      const { session, payload } = event;
      const { from } = payload;

      // Find bot by session name
      const bot = await WhatsAppBot.findOne({
        $or: [
          { name: session },
          { phoneNumber: { $regex: session.replace(/\D/g, '') } }
        ]
      });

      if (!bot) {
        logger.warn(`Bot not found for session: ${session}`);
        return;
      }

      // Handle incoming message with conversation state
      const result = await this.handleIncomingMessage((bot._id as any).toString(), from, payload, bot.subDomain);

      // Send response if available
      if (result.response) {
        await this.sendTextMessage((bot._id as any).toString(), from, result.response);
      }

      logger.info(`Handled incoming message from ${from} with session ${result.sessionId}`);
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

  // Order Management from Conversation
  async createOrderFromConversation(
    sessionId: string,
    orderData: Partial<IOrder>
  ): Promise<IOrder> {
    try {
      // Get conversation state
      const conversation = await conversationStateManager.getBySessionId(sessionId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Generate order number
      const orderNumber = await this.generateOrderNumber(conversation.subDomain);

      // Create order with conversation reference
      const order = new Order({
        orderNumber,
        customer: {
          name: conversation.context.customerName || 'Cliente WhatsApp',
          phone: conversation.userId,
          email: conversation.context.customerEmail
        },
        items: conversation.context.selectedItems || [],
        subtotal: conversation.context.orderTotal || 0,
        tax: 0, // Calculate based on your tax rules
        deliveryFee: 0, // Calculate based on delivery info
        discount: 0,
        total: conversation.context.orderTotal || 0,
        status: 'pending',
        type: conversation.context.orderType || 'delivery',
        paymentMethod: conversation.context.paymentMethod || 'cash',
        paymentStatus: 'pending',
        source: 'whatsapp',
        notes: conversation.context.orderNotes,
        deliveryInfo: conversation.context.deliveryAddress ? {
          address: {
            street: conversation.context.deliveryAddress.street || '',
            city: conversation.context.deliveryAddress.city || '',
            state: '',
            zipCode: conversation.context.deliveryAddress.postalCode || '',
            country: 'Peru'
          },
          deliveryInstructions: conversation.context.deliveryAddress.notes
        } : undefined,
        localId: conversation.subDomain, // Using subDomain as localId for now
        subDomain: conversation.subDomain,
        conversationId: sessionId,
        botId: conversation.botId.toString(),
        ...orderData
      });

      await order.save();

      // Update conversation with order reference
      await conversationStateManager.updateContext(sessionId, {
        currentOrderId: (order._id as any).toString(),
        orderHistory: [...(conversation.context.orderHistory || []), (order._id as any).toString()]
      });

      logger.info(`Order created from conversation ${sessionId}: ${order.orderNumber}`);
      return order;
    } catch (error) {
      logger.error('Error creating order from conversation:', error);
      throw error;
    }
  }

  async getOrderByConversation(sessionId: string): Promise<IOrder | null> {
    try {
      const conversation = await conversationStateManager.getBySessionId(sessionId);
      if (!conversation || !conversation.currentOrderId) {
        return null;
      }

      return await Order.findById(conversation.currentOrderId);
    } catch (error) {
      logger.error('Error getting order by conversation:', error);
      throw error;
    }
  }

  async updateOrderFromConversation(
    sessionId: string,
    updates: Partial<IOrder>
  ): Promise<IOrder | null> {
    try {
      const order = await this.getOrderByConversation(sessionId);
      if (!order) {
        throw new Error('No active order found for this conversation');
      }

      // Update order
      Object.assign(order, updates);
      await order.save();

      logger.info(`Order updated from conversation ${sessionId}: ${order.orderNumber}`);
      return order;
    } catch (error) {
      logger.error('Error updating order from conversation:', error);
      throw error;
    }
  }

  async addItemToOrder(
    sessionId: string,
    item: any
  ): Promise<IOrder | null> {
    try {
      const order = await this.getOrderByConversation(sessionId);
      if (!order) {
        // Create new order if none exists
        return await this.createOrderFromConversation(sessionId, {
          items: [item],
          subtotal: item.totalPrice,
          total: item.totalPrice
        });
      }

      // Add item to existing order
      order.items.push(item);
      order.subtotal += item.totalPrice;
      order.total = order.subtotal + order.tax + order.deliveryFee - order.discount;
      await order.save();

      // Update conversation context
      const conversation = await conversationStateManager.getBySessionId(sessionId);
      if (conversation) {
        await conversationStateManager.updateContext(sessionId, {
          selectedItems: order.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.totalPrice,
            notes: item.notes
          })),
          orderTotal: order.total
        });
      }

      logger.info(`Item added to order from conversation ${sessionId}`);
      return order;
    } catch (error) {
      logger.error('Error adding item to order:', error);
      throw error;
    }
  }

  async getConversationOrders(sessionId: string): Promise<IOrder[]> {
    try {
      const conversation = await conversationStateManager.getBySessionId(sessionId);
      if (!conversation || !conversation.context.orderHistory) {
        return [];
      }

      return await Order.find({
        _id: { $in: conversation.context.orderHistory }
      }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting conversation orders:', error);
      throw error;
    }
  }

  async getBotOrders(botId: string, limit = 50): Promise<IOrder[]> {
    try {
      return await Order.find({ botId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Error getting bot orders:', error);
      throw error;
    }
  }

  // Conversation Management Methods
  async getActiveConversations(botId: string, limit = 100) {
    try {
      return await conversationStateManager.getActiveByBot(botId, limit);
    } catch (error) {
      logger.error('Error getting active conversations:', error);
      throw error;
    }
  }

  async updateConversationIntent(sessionId: string, intent: ConversationIntent, step?: string) {
    try {
      return await conversationStateManager.changeIntent(sessionId, intent, step);
    } catch (error) {
      logger.error('Error updating conversation intent:', error);
      throw error;
    }
  }

  async endConversation(sessionId: string) {
    try {
      await conversationStateManager.endConversation(sessionId);
    } catch (error) {
      logger.error('Error ending conversation:', error);
      throw error;
    }
  }

  // Enhanced message handling with conversation state
  async handleIncomingMessage(
    botId: string,
    from: string,
    message: any,
    subDomain: string
  ): Promise<{ response?: string; sessionId: string }> {
    try {
      // Get or create conversation state
      const conversation = await conversationStateManager.getOrCreate(
        from,
        botId,
        subDomain,
        24
      );

      // Add user message to conversation
      await conversationStateManager.addMessage(
        conversation.sessionId,
        'user',
        message.text || 'Media message'
      );

      // Process message based on current intent and step
      const response = await this.processMessageWithIntent(
        conversation,
        message
      );

      // Add bot response to conversation
      if (response) {
        await conversationStateManager.addMessage(
          conversation.sessionId,
          'bot',
          response
        );
      }

      return {
        response: response || undefined,
        sessionId: conversation.sessionId
      };
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      throw error;
    }
  }

  private async processMessageWithIntent(
    conversation: any,
    message: any
  ): Promise<string | null> {
    try {
      const { currentIntent } = conversation;
      const userMessage = message.text?.toLowerCase() || '';

      // Intent-based message processing
      switch (currentIntent) {
        case 'idle':
          return this.handleIdleIntent(userMessage, conversation);
        
        case 'menu':
          return this.handleMenuIntent(userMessage, conversation);
        
        case 'order':
          return this.handleOrderIntent(userMessage, conversation);
        
        case 'support':
          return this.handleSupportIntent(userMessage, conversation);
        
        case 'payment':
          return this.handlePaymentIntent(userMessage, conversation);
        
        case 'delivery':
          return this.handleDeliveryIntent(userMessage, conversation);
        
        default:
          return this.handleIdleIntent(userMessage, conversation);
      }
    } catch (error) {
      logger.error('Error processing message with intent:', error);
      return "Lo siento, hubo un error procesando tu mensaje. ¿Puedes intentar de nuevo?";
    }
  }

  private async handleIdleIntent(userMessage: string, conversation: any): Promise<string> {
    const greetings = ['hola', 'hi', 'hello', 'buenos días', 'buenas tardes', 'buenas noches'];
    const menuKeywords = ['menú', 'menu', 'carta', 'comida', 'platos'];
    const orderKeywords = ['pedido', 'orden', 'comprar', 'quiero'];
    const supportKeywords = ['ayuda', 'help', 'soporte', 'problema'];

    if (greetings.some(greeting => userMessage.includes(greeting))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'idle', 'greeting');
      return "¡Hola! Bienvenido a nuestro restaurante. ¿En qué puedo ayudarte hoy? Puedes pedir ver el menú, hacer un pedido, o contactar soporte.";
    }

    if (menuKeywords.some(keyword => userMessage.includes(keyword))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'menu', 'browsing');
      return "¡Perfecto! Te voy a mostrar nuestro menú. ¿Qué tipo de comida prefieres? (ej: pizza, pasta, ensaladas, bebidas)";
    }

    if (orderKeywords.some(keyword => userMessage.includes(keyword))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'selecting');
      return "¡Excelente! Vamos a crear tu pedido. Primero, ¿qué te gustaría ordenar?";
    }

    if (supportKeywords.some(keyword => userMessage.includes(keyword))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'support', 'initial');
      return "Estoy aquí para ayudarte. ¿Cuál es tu consulta o problema?";
    }

    return "No estoy seguro de cómo ayudarte. Puedes pedir ver el menú, hacer un pedido, o contactar soporte. ¿Qué prefieres?";
  }

  private async handleMenuIntent(_userMessage: string, _conversation: any): Promise<string> {
    // Implement menu browsing logic
    return "Aquí tienes nuestro menú. ¿Te interesa algún plato en particular?";
  }

  private async handleOrderIntent(userMessage: string, conversation: any): Promise<string> {
    const { currentStep } = conversation;

    switch (currentStep) {
      case 'selecting':
        return await this.handleItemSelection(userMessage, conversation);
      
      case 'confirming':
        return await this.handleOrderConfirmation(userMessage, conversation);
      
      case 'payment':
        return await this.handlePaymentSelection(userMessage, conversation);
      
      case 'delivery':
        return await this.handleDeliveryInfo(userMessage, conversation);
      
      default:
        return await this.handleItemSelection(userMessage, conversation);
    }
  }

  private async handleItemSelection(userMessage: string, conversation: any): Promise<string> {
    // Parse user message for item selection
    const item = await this.parseItemFromMessage(userMessage, conversation.subDomain);
    
    if (item) {
      await this.addItemToOrder(conversation.sessionId, item);
      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'confirming');
      
      return `¡Perfecto! Agregué ${item.name} a tu pedido. ¿Quieres agregar algo más o proceder con el pedido?`;
    }

    return "No pude entender qué quieres ordenar. ¿Puedes ser más específico? Por ejemplo: 'Quiero una pizza margarita' o 'Agrega una coca cola'";
  }

  private async handleOrderConfirmation(userMessage: string, conversation: any): Promise<string> {
    const confirmKeywords = ['sí', 'si', 'yes', 'confirmar', 'proceder', 'listo'];
    const addMoreKeywords = ['más', 'agregar', 'añadir', 'otro'];

    if (confirmKeywords.some(keyword => userMessage.includes(keyword))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'payment');
      return "¡Excelente! Ahora necesito saber cómo quieres pagar. ¿Efectivo, tarjeta, Yape, o Plin?";
    }

    if (addMoreKeywords.some(keyword => userMessage.includes(keyword))) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'selecting');
      return "¡Perfecto! ¿Qué más te gustaría agregar a tu pedido?";
    }

    return "¿Quieres confirmar tu pedido o agregar algo más?";
  }

  private async handlePaymentSelection(userMessage: string, conversation: any): Promise<string> {
    const paymentMethods = {
      'efectivo': 'cash',
      'cash': 'cash',
      'tarjeta': 'card',
      'card': 'card',
      'yape': 'yape',
      'plin': 'plin',
      'mercado pago': 'mercado_pago',
      'transferencia': 'bank_transfer'
    };

    const selectedMethod = Object.keys(paymentMethods).find(method => 
      userMessage.toLowerCase().includes(method)
    );

    if (selectedMethod) {
      const paymentMethodValue = paymentMethods[selectedMethod as keyof typeof paymentMethods];
      await conversationStateManager.updateContext(conversation.sessionId, {
        paymentMethod: paymentMethodValue as
          | "cash"
          | "card"
          | "yape"
          | "plin"
          | "mercado_pago"
          | "bank_transfer"
          | "transfer"
          | undefined
      });

      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'delivery');
      return `¡Perfecto! Pago con ${selectedMethod}. Ahora necesito tu dirección de entrega. ¿Cuál es tu dirección completa?`;
    }


    return "Por favor selecciona un método de pago: Efectivo, Tarjeta, Yape, Plin, Mercado Pago, o Transferencia";
  }

  private async handleDeliveryInfo(userMessage: string, conversation: any): Promise<string> {
    // Parse delivery address from user message
    await conversationStateManager.updateContext(conversation.sessionId, {
      deliveryAddress: {
        street: userMessage,
        notes: 'Entregado por WhatsApp'
      }
    });

    // Create the order
    const order = await this.createOrderFromConversation(conversation.sessionId, {});
    
    await conversationStateManager.changeIntent(conversation.sessionId, 'idle', 'order_completed');
    
    return `¡Pedido confirmado! Tu número de pedido es: ${order.orderNumber}. Te contactaremos pronto para confirmar la entrega. ¡Gracias por elegirnos!`;
  }

  private async handleSupportIntent(_userMessage: string, _conversation: any): Promise<string> {
    // Implement support logic
    return "Entiendo tu consulta. Te voy a conectar con nuestro equipo de soporte.";
  }

  private async handlePaymentIntent(_userMessage: string, _conversation: any): Promise<string> {
    // Implement payment logic
    return "Perfecto, vamos a procesar tu pago.";
  }

  private async handleDeliveryIntent(_userMessage: string, _conversation: any): Promise<string> {
    // Implement delivery logic
    return "Vamos a configurar la entrega de tu pedido.";
  }

  private async parseItemFromMessage(message: string, _subDomain: string): Promise<any> {
    // This would integrate with your Product model to find items
    // For now, return a mock item
    return {
      id: 'item_' + Date.now(),
      productId: 'product_123',
      name: 'Producto desde WhatsApp',
      quantity: 1,
      unitPrice: 10.00,
      totalPrice: 10.00,
      notes: `Pedido desde WhatsApp: ${message}`
    };
  }

  private async generateOrderNumber(subDomain: string): Promise<string> {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `WA${subDomain.toUpperCase()}${timestamp}${random}`;
  }
}

export const whatsappService = new WhatsAppService();