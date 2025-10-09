import { ConversationState, IConversationState, IConversationContext } from '../models/ConversationState';

export type ConversationIntent = 'menu' | 'order' | 'support' | 'info' | 'payment' | 'delivery' | 'idle';

import logger from '../utils/logger';

export interface CreateConversationStateParams {
  userId: string;
  botId: string;
  subDomain: string;
  initialIntent?: ConversationIntent;
  initialStep?: string;
  initialContext?: Partial<IConversationContext>;
  metadata?: Record<string, any>;
  expirationHours?: number;
}

export interface UpdateConversationStateParams {
  currentIntent?: ConversationIntent;
  currentStep?: string;
  context?: Partial<IConversationContext>;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export class ConversationStateManager {
  // Create or get existing conversation state
  async getOrCreate(
    userId: string,
    botId: string,
    subDomain: string,
    expirationHours = 24
  ): Promise<IConversationState> {
    try {
      // Try to find active conversation
      let state = await ConversationState.findOne({
        userId,
        botId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (state) {
        // Update last activity and extend expiration
        state.lastActivity = new Date();
        state.expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
        await state.save();
        logger.info(`Retrieved existing conversation state: ${state.sessionId}`);
        return state;
      }

      // Create new conversation state
      const sessionId = this.generateSessionId(userId, botId);
      state = new ConversationState({
        sessionId,
        userId,
        botId,
        subDomain,
        currentIntent: 'idle',
        currentStep: 'initial',
        context: {},
        metadata: {},
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000)
      });

      await state.save();
      logger.info(`Created new conversation state: ${state.sessionId}`);
      return state;
    } catch (error) {
      logger.error('Error getting or creating conversation state:', error);
      throw error;
    }
  }

  // Create new conversation state
  async create(params: CreateConversationStateParams): Promise<IConversationState> {
    try {
      const sessionId = this.generateSessionId(params.userId, params.botId);
      const expirationHours = params.expirationHours || 24;

      const state = new ConversationState({
        sessionId,
        userId: params.userId,
        botId: params.botId,
        subDomain: params.subDomain,
        currentIntent: params.initialIntent || 'idle',
        currentStep: params.initialStep || 'initial',
        context: params.initialContext || {},
        metadata: params.metadata || {},
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000)
      });

      await state.save();
      logger.info(`Created conversation state: ${state.sessionId}`);
      return state;
    } catch (error) {
      logger.error('Error creating conversation state:', error);
      throw error;
    }
  }

  // Get conversation state by session ID
  async getBySessionId(sessionId: string): Promise<IConversationState | null> {
    try {
      return await ConversationState.findOne({ sessionId });
    } catch (error) {
      logger.error('Error getting conversation state by session ID:', error);
      throw error;
    }
  }

  // Get active conversation state by user and bot
  async getActive(userId: string, botId: string): Promise<IConversationState | null> {
    try {
      return await ConversationState.findOne({
        userId,
        botId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
    } catch (error) {
      logger.error('Error getting active conversation state:', error);
      throw error;
    }
  }

  // Get all active conversations for a bot
  async getActiveByBot(botId: string, limit = 100): Promise<IConversationState[]> {
    try {
      return await ConversationState.find({
        botId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      })
      .sort({ lastActivity: -1 })
      .limit(limit);
    } catch (error) {
      logger.error('Error getting active conversations for bot:', error);
      throw error;
    }
  }

  // Update conversation state
  async update(
    sessionId: string,
    updates: UpdateConversationStateParams
  ): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        logger.warn(`Conversation state not found: ${sessionId}`);
        return null;
      }

      // Update fields
      if (updates.currentIntent) {
        state.previousIntent = state.currentIntent;
        state.currentIntent = updates.currentIntent;
      }
      
      if (updates.currentStep) {
        state.previousStep = state.currentStep;
        state.currentStep = updates.currentStep;
      }

      if (updates.context) {
        state.context = { ...state.context, ...updates.context };
      }

      if (updates.metadata) {
        state.metadata = { ...state.metadata, ...updates.metadata };
      }

      if (updates.isActive !== undefined) {
        state.isActive = updates.isActive;
      }

      state.lastActivity = new Date();
      await state.save();

      logger.info(`Updated conversation state: ${sessionId}`);
      return state;
    } catch (error) {
      logger.error('Error updating conversation state:', error);
      throw error;
    }
  }

  // Update context only
  async updateContext(
    sessionId: string,
    contextUpdates: Partial<IConversationContext>
  ): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        return null;
      }

      state.context = { ...state.context, ...contextUpdates };
      state.lastActivity = new Date();
      await state.save();

      return state;
    } catch (error) {
      logger.error('Error updating conversation context:', error);
      throw error;
    }
  }

  // Change intent and step
  async changeIntent(
    sessionId: string,
    intent: ConversationIntent,
    step?: string
  ): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        return null;
      }

      // Update intent and step manually
      state.previousIntent = state.currentIntent;
      state.previousStep = state.currentStep;
      state.currentIntent = intent;
      if (step) state.currentStep = step;
      state.lastActivity = new Date();
      await state.save();

      logger.info(`Changed intent for ${sessionId}: ${intent} -> ${step || 'default'}`);
      return state;
    } catch (error) {
      logger.error('Error changing conversation intent:', error);
      throw error;
    }
  }

  // Add message to conversation history
  async addMessage(
    sessionId: string,
    role: 'user' | 'bot',
    content: string
  ): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        return null;
      }

      // Add message to conversation history manually
      if (!state.context.previousMessages) {
        state.context.previousMessages = [];
      }
      
      // Keep only last 20 messages to avoid document size issues
      if (state.context.previousMessages.length >= 20) {
        state.context.previousMessages.shift();
      }
      
      state.context.previousMessages.push({
        role,
        content,
        timestamp: new Date()
      });
      
      if (role === 'user') {
        state.context.lastUserMessage = content;
      }
      
      state.lastActivity = new Date();
      await state.save();

      return state;
    } catch (error) {
      logger.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  // Reset conversation context
  async resetContext(sessionId: string, keepHistory = false): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        return null;
      }

      // Reset context manually
      const history = keepHistory ? state.context.previousMessages : [];
      state.context = {
        previousMessages: history
      };
      state.currentIntent = 'idle';
      state.currentStep = 'initial';
      await state.save();

      logger.info(`Reset context for ${sessionId}`);
      return state;
    } catch (error) {
      logger.error('Error resetting conversation context:', error);
      throw error;
    }
  }

  // End conversation
  async endConversation(sessionId: string): Promise<void> {
    try {
      await ConversationState.findOneAndUpdate(
        { sessionId },
        {
          isActive: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Keep for 7 days for analytics
        }
      );
      logger.info(`Ended conversation: ${sessionId}`);
    } catch (error) {
      logger.error('Error ending conversation:', error);
      throw error;
    }
  }

  // Extend conversation expiration
  async extendExpiration(sessionId: string, hours = 24): Promise<IConversationState | null> {
    try {
      const state = await ConversationState.findOne({ sessionId });
      if (!state) {
        return null;
      }

      // Extend expiration manually
      state.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      await state.save();
      return state;
    } catch (error) {
      logger.error('Error extending conversation expiration:', error);
      throw error;
    }
  }

  // Get conversation history
  async getConversationHistory(
    userId: string,
    botId: string,
    limit = 10
  ): Promise<IConversationState[]> {
    try {
      return await ConversationState.find({
        userId,
        botId
      })
      .sort({ createdAt: -1 })
      .limit(limit);
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw error;
    }
  }

  // Clean up expired conversations (can be run as a cron job)
  async cleanupExpired(): Promise<number> {
    try {
      const result = await ConversationState.deleteMany({
        expiresAt: { $lt: new Date() },
        isActive: false
      });
      
      logger.info(`Cleaned up ${result.deletedCount} expired conversations`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired conversations:', error);
      throw error;
    }
  }

  // Get statistics
  async getStatistics(botId: string, days = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [total, active, byIntent] = await Promise.all([
        ConversationState.countDocuments({
          botId,
          createdAt: { $gte: startDate }
        }),
        ConversationState.countDocuments({
          botId,
          isActive: true,
          expiresAt: { $gt: new Date() }
        }),
        ConversationState.aggregate([
          {
            $match: {
              botId: botId,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$currentIntent',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      return {
        total,
        active,
        byIntent: byIntent.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      logger.error('Error getting conversation statistics:', error);
      throw error;
    }
  }

  // Helper: Generate unique session ID
  private generateSessionId(userId: string, botId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${botId}_${userId.replace(/\D/g, '')}_${timestamp}_${random}`;
  }
}

export const conversationStateManager = new ConversationStateManager();
