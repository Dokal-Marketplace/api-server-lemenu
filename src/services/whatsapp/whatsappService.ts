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
    const { currentStep } = conversation;
    
    // Check if we're in the address collection flow
    if (currentStep === 'collecting_address') {
      return this.handleAddressCollection(userMessage, conversation);
    }
    
    // Start address collection flow
    await conversationStateManager.updateContext(conversation.sessionId, {
      addressCollectionStep: 'street'
    });
    await conversationStateManager.changeIntent(conversation.sessionId, 'delivery', 'collecting_address');
    
    return "Para completar tu pedido, necesito tu dirección de entrega. Por favor, proporciona la siguiente información:\n\n1️⃣ **Calle y número** (ej: Av. Principal 123)";
  }

  private async handleAddressCollection(userMessage: string, conversation: any): Promise<string> {
    const { addressCollectionStep } = conversation.context;
    const addressData = conversation.context.deliveryAddress || {};
    
    switch (addressCollectionStep) {
      case 'street':
        addressData.street = userMessage.trim();
        await conversationStateManager.updateContext(conversation.sessionId, {
          deliveryAddress: addressData,
          addressCollectionStep: 'city'
        });
        return "2️⃣ **Ciudad** (ej: Lima, Arequipa, Trujillo)";
        
      case 'city':
        addressData.city = userMessage.trim();
        await conversationStateManager.updateContext(conversation.sessionId, {
          deliveryAddress: addressData,
          addressCollectionStep: 'district'
        });
        return "3️⃣ **Distrito** (ej: Miraflores, San Isidro, Surco)";
        
      case 'district':
        addressData.state = userMessage.trim(); // Using state field for district
        await conversationStateManager.updateContext(conversation.sessionId, {
          deliveryAddress: addressData,
          addressCollectionStep: 'postal_code'
        });
        return "4️⃣ **Código postal** (opcional, ej: 15001)";
        
      case 'postal_code':
        addressData.postalCode = userMessage.trim();
        addressData.country = 'Perú'; // Default country
        addressData.notes = 'Entregado por WhatsApp';
        
        // Validate address completeness
        if (!this.validateAddress(addressData)) {
          await conversationStateManager.updateContext(conversation.sessionId, {
            addressCollectionStep: 'street'
          });
          return "❌ La dirección parece incompleta. Por favor, proporciona una dirección válida:\n\n1️⃣ **Calle y número**";
        }
        
        await conversationStateManager.updateContext(conversation.sessionId, {
          deliveryAddress: addressData,
          addressCollectionStep: 'complete'
    });

    // Create the order
    const order = await this.createOrderFromConversation(conversation.sessionId, {});
    await conversationStateManager.changeIntent(conversation.sessionId, 'idle', 'order_completed');
    
        return `✅ **Dirección registrada correctamente**\n\n📍 ${addressData.street}, ${addressData.city}, ${addressData.state}\n\n🎉 ¡Pedido confirmado! Tu número de pedido es: **${order.orderNumber}**\n\nTe contactaremos pronto para confirmar la entrega. ¡Gracias por elegirnos!`;
        
      default:
        return this.handleDeliveryInfo(userMessage, conversation);
    }
  }

  private validateAddress(address: any): boolean {
    return !!(address.street && address.city && address.state && 
              address.street.length > 5 && 
              address.city.length > 2 && 
              address.state.length > 2);
  }

  private async handleSupportIntent(userMessage: string, conversation: any): Promise<string> {
    const { currentStep } = conversation;
    
    // Check if we're in the support flow
    if (currentStep === 'collecting_issue') {
      return this.handleSupportIssueCollection(userMessage, conversation);
    }
    
    // Start support flow
    await conversationStateManager.updateContext(conversation.sessionId, {
      supportIssue: userMessage,
      supportStep: 'collecting_contact'
    });
    await conversationStateManager.changeIntent(conversation.sessionId, 'support', 'collecting_issue');
    
    return "Entiendo que necesitas ayuda. Para brindarte el mejor soporte, ¿podrías proporcionarme tu nombre completo?";
  }

  private async handleSupportIssueCollection(userMessage: string, conversation: any): Promise<string> {
    const { supportStep } = conversation.context;
    
    switch (supportStep) {
      case 'collecting_contact':
        await conversationStateManager.updateContext(conversation.sessionId, {
          customerName: userMessage.trim(),
          supportStep: 'collecting_email'
        });
        return "Gracias. ¿Cuál es tu correo electrónico? (opcional)";
        
      case 'collecting_email':
        if (userMessage.trim() && userMessage.includes('@')) {
          await conversationStateManager.updateContext(conversation.sessionId, {
            customerEmail: userMessage.trim(),
            supportStep: 'complete'
          });
        } else {
          await conversationStateManager.updateContext(conversation.sessionId, {
            supportStep: 'complete'
          });
        }
        
        // Log support request for follow-up
        const supportData = {
          issue: conversation.context.supportIssue,
          customerName: conversation.context.customerName,
          customerEmail: conversation.context.customerEmail,
          phone: conversation.userId,
          timestamp: new Date(),
          subDomain: conversation.subDomain
        };
        
        logger.info('Support request received:', supportData);
        
        await conversationStateManager.changeIntent(conversation.sessionId, 'idle', 'support_completed');
        
        return `✅ **Solicitud de soporte registrada**\n\n📋 **Asunto:** ${conversation.context.supportIssue}\n👤 **Nombre:** ${conversation.context.customerName}\n📞 **Teléfono:** ${conversation.userId}\n\nNuestro equipo de soporte se pondrá en contacto contigo pronto. ¡Gracias por tu paciencia!`;
        
      default:
        return this.handleSupportIntent(userMessage, conversation);
    }
  }

  private async handlePaymentIntent(userMessage: string, conversation: any): Promise<string> {
    const { currentStep } = conversation;
    
    // Check if we're in the payment flow
    if (currentStep === 'processing_payment') {
      return this.handlePaymentProcessing(userMessage, conversation);
    }
    
    // Check if user has items in cart
    const selectedItems = conversation.context.selectedItems || [];
    if (selectedItems.length === 0) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'menu', 'browsing');
      return "No tienes productos en tu carrito. ¿Te gustaría ver nuestro menú?";
    }
    
    // Start payment flow
    const orderTotal = conversation.context.orderTotal || 0;
    if (orderTotal <= 0) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'order', 'reviewing');
      return "Primero necesito calcular el total de tu pedido. ¿Podrías confirmar los productos seleccionados?";
    }
    
    await conversationStateManager.changeIntent(conversation.sessionId, 'payment', 'processing_payment');
    
    return `💳 **Procesamiento de Pago**\n\n💰 **Total a pagar:** S/ ${orderTotal.toFixed(2)}\n\nSelecciona tu método de pago:\n\n1️⃣ **Efectivo** - Pago al recibir\n2️⃣ **Tarjeta** - Débito/Crédito\n3️⃣ **Yape** - Transferencia móvil\n4️⃣ **Plin** - Transferencia móvil\n5️⃣ **Mercado Pago** - Pago digital\n6️⃣ **Transferencia** - Bancaria\n\nResponde con el número de tu opción preferida.`;
  }

  private async handlePaymentProcessing(userMessage: string, conversation: any): Promise<string> {
    const paymentOptions: Record<string, string> = {
      '1': 'cash',
      '2': 'card', 
      '3': 'yape',
      '4': 'plin',
      '5': 'mercado_pago',
      '6': 'bank_transfer',
      'efectivo': 'cash',
      'tarjeta': 'card',
      'yape': 'yape',
      'plin': 'plin',
      'mercado pago': 'mercado_pago',
      'transferencia': 'bank_transfer'
    };
    
    const selectedMethod = paymentOptions[userMessage.toLowerCase().trim()];
    
    if (selectedMethod) {
      await conversationStateManager.updateContext(conversation.sessionId, {
        paymentMethod: selectedMethod as "cash" | "card" | "yape" | "plin" | "mercado_pago" | "bank_transfer",
        paymentStatus: 'pending'
      });
      
      // Generate payment instructions based on method
      const paymentInstructions = this.getPaymentInstructions(selectedMethod, conversation.context.orderTotal);
      
      await conversationStateManager.changeIntent(conversation.sessionId, 'delivery', 'collecting_address');
      
      return `✅ **Método de pago seleccionado:** ${this.getPaymentMethodName(selectedMethod)}\n\n${paymentInstructions}\n\nAhora necesito tu dirección de entrega para completar el pedido.`;
    }
    
    return "❌ Método de pago no válido. Por favor selecciona una opción del 1 al 6 o escribe el nombre del método de pago.";
  }

  private getPaymentInstructions(method: string, total: number): string {
    const instructions: Record<string, string> = {
      'cash': `💰 **Pago en efectivo**\nPagarás S/ ${total.toFixed(2)} al recibir tu pedido.`,
      'card': `💳 **Pago con tarjeta**\nSe procesará el pago de S/ ${total.toFixed(2)} al confirmar el pedido.`,
      'yape': `📱 **Pago con Yape**\nTransferir S/ ${total.toFixed(2)} al número: +51 999 999 999\n(Envía el comprobante al confirmar)`,
      'plin': `📱 **Pago con Plin**\nTransferir S/ ${total.toFixed(2)} al número: +51 999 999 999\n(Envía el comprobante al confirmar)`,
      'mercado_pago': `💻 **Mercado Pago**\nSe generará un enlace de pago por S/ ${total.toFixed(2)}.`,
      'bank_transfer': `🏦 **Transferencia bancaria**\nTransferir S/ ${total.toFixed(2)} a la cuenta:\nBanco: BCP\nCuenta: 123-45678901\n(Envía el comprobante al confirmar)`
    };
    
    return instructions[method] || '';
  }

  private getPaymentMethodName(method: string): string {
    const names: Record<string, string> = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'yape': 'Yape',
      'plin': 'Plin',
      'mercado_pago': 'Mercado Pago',
      'bank_transfer': 'Transferencia bancaria'
    };
    
    return names[method] || method;
  }

  private async handleDeliveryIntent(userMessage: string, conversation: any): Promise<string> {
    const { currentStep } = conversation;
    
    // Check if we're in the delivery configuration flow
    if (currentStep === 'configuring_delivery') {
      return this.handleDeliveryConfiguration(userMessage, conversation);
    }
    
    // Check if user has items and payment method
    const selectedItems = conversation.context.selectedItems || [];
    const paymentMethod = conversation.context.paymentMethod;
    
    if (selectedItems.length === 0) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'menu', 'browsing');
      return "No tienes productos en tu carrito. ¿Te gustaría ver nuestro menú?";
    }
    
    if (!paymentMethod) {
      await conversationStateManager.changeIntent(conversation.sessionId, 'payment', 'processing_payment');
      return "Primero necesito que selecciones un método de pago.";
    }
    
    // Start delivery configuration
    await conversationStateManager.changeIntent(conversation.sessionId, 'delivery', 'configuring_delivery');
    
    return `🚚 **Configuración de Entrega**\n\n¿Cómo prefieres recibir tu pedido?\n\n1️⃣ **Delivery** - Entrega a domicilio\n2️⃣ **Recojo** - Recoger en tienda\n3️⃣ **Programar** - Entrega programada\n\nResponde con el número de tu opción preferida.`;
  }

  private async handleDeliveryConfiguration(userMessage: string, conversation: any): Promise<string> {
    const deliveryOptions: Record<string, string> = {
      '1': 'delivery',
      '2': 'pickup',
      '3': 'scheduled_delivery',
      'delivery': 'delivery',
      'domicilio': 'delivery',
      'recojo': 'pickup',
      'pickup': 'pickup',
      'programar': 'scheduled_delivery',
      'programada': 'scheduled_delivery'
    };
    
    const selectedType = deliveryOptions[userMessage.toLowerCase().trim()];
    
    if (selectedType) {
      await conversationStateManager.updateContext(conversation.sessionId, {
        deliveryType: selectedType
      });
      
      switch (selectedType) {
        case 'delivery':
          return this.handleDeliveryInfo(userMessage, conversation);
          
        case 'pickup':
          return this.handlePickupConfiguration(conversation);
          
        case 'scheduled_delivery':
          return this.handleScheduledDeliveryConfiguration(conversation);
          
        default:
          return "Opción no válida. Por favor selecciona 1, 2 o 3.";
      }
    }
    
    return "❌ Opción no válida. Por favor selecciona:\n\n1️⃣ **Delivery** - Entrega a domicilio\n2️⃣ **Recojo** - Recoger en tienda\n3️⃣ **Programar** - Entrega programada";
  }

  private async handlePickupConfiguration(conversation: any): Promise<string> {
    // For pickup, we need to get business location info
    // This would typically come from the business configuration
    const pickupInstructions = `🏪 **Recojo en Tienda**\n\n📍 **Ubicación:** Av. Principal 123, Lima\n🕒 **Horarios:** Lunes a Domingo 9:00 AM - 10:00 PM\n📞 **Teléfono:** +51 1 234 5678\n\nTu pedido estará listo en aproximadamente 20-30 minutos.\n\n¿Confirmas el recojo en tienda? (Responde: Sí o No)`;
    
    await conversationStateManager.updateContext(conversation.sessionId, {
      deliveryType: 'pickup',
      pickupLocation: {
        address: 'Av. Principal 123, Lima',
        phone: '+51 1 234 5678',
        hours: 'Lunes a Domingo 9:00 AM - 10:00 PM'
      }
    });
    
    return pickupInstructions;
  }

  private async handleScheduledDeliveryConfiguration(conversation: any): Promise<string> {
    await conversationStateManager.updateContext(conversation.sessionId, {
      deliveryType: 'scheduled_delivery',
      schedulingStep: 'select_date'
    });
    
    return `📅 **Entrega Programada**\n\n¿Para qué fecha quieres programar tu entrega?\n\nResponde con la fecha en formato: DD/MM/AAAA\nEjemplo: 25/12/2024\n\nO escribe "hoy" para el día de hoy.`;
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