import logger from '../../utils/logger';

interface MessageRate {
  count: number;
  windowStart: number;
}

interface UserInteraction {
  lastMessageTime: number;
  messageCount: number;
  isTyping: boolean;
  lastSeenTime: number;
}

export class ComplianceService {
  private messageRates: Map<string, MessageRate> = new Map();
  private userInteractions: Map<string, UserInteraction> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly MAX_MESSAGES_PER_HOUR = 4; // As per WAHA guidelines
  private readonly MIN_TYPING_DELAY = 1000; // 1 second
  private readonly MAX_TYPING_DELAY = 5000; // 5 seconds
  private readonly MIN_MESSAGE_DELAY = 30000; // 30 seconds
  private readonly MAX_MESSAGE_DELAY = 60000; // 60 seconds

  /**
   * Check if a user can receive a message based on rate limiting
   */
  canSendMessage(botId: string, userId: string): boolean {
    const key = `${botId}_${userId}`;
    const now = Date.now();
    const rate = this.messageRates.get(key);

    if (!rate) {
      this.messageRates.set(key, { count: 1, windowStart: now });
      return true;
    }

    // Reset window if it's been more than an hour
    if (now - rate.windowStart > this.RATE_LIMIT_WINDOW) {
      this.messageRates.set(key, { count: 1, windowStart: now });
      return true;
    }

    // Check if under rate limit
    if (rate.count < this.MAX_MESSAGES_PER_HOUR) {
      rate.count++;
      return true;
    }

    logger.warn(`Rate limit exceeded for user ${userId} in bot ${botId}`);
    return false;
  }

  /**
   * Get random delay for typing indicator based on message length
   */
  getTypingDelay(messageLength: number): number {
    // Base delay + additional time based on message length
    const baseDelay = this.getRandomDelay(this.MIN_TYPING_DELAY, this.MAX_TYPING_DELAY);
    const lengthDelay = Math.min(messageLength * 50, 3000); // Max 3 seconds for very long messages
    return baseDelay + lengthDelay;
  }

  /**
   * Get random delay between messages to appear human-like
   */
  getMessageDelay(): number {
    return this.getRandomDelay(this.MIN_MESSAGE_DELAY, this.MAX_MESSAGE_DELAY);
  }

  /**
   * Add random spacing to message text to avoid spam detection
   */
  addRandomSpacing(text: string, userName?: string): string {
    let modifiedText = text;
    
    // Add user's name if provided
    if (userName) {
      const nameVariations = [
        `Hola ${userName}!`,
        `Hola ${userName},`,
        `${userName},`,
        `Hola ${userName} 👋`
      ];
      const greeting = nameVariations[Math.floor(Math.random() * nameVariations.length)];
      modifiedText = `${greeting} ${text}`;
    }

    // Randomly add spaces in the middle of words (but not too many)
    if (Math.random() < 0.3) { // 30% chance
      const words = modifiedText.split(' ');
      const modifiedWords = words.map(word => {
        if (word.length > 4 && Math.random() < 0.1) { // 10% chance for longer words
          const splitPoint = Math.floor(word.length / 2);
          return word.slice(0, splitPoint) + ' ' + word.slice(splitPoint);
        }
        return word;
      });
      modifiedText = modifiedWords.join(' ');
    }

    return modifiedText;
  }

  /**
   * Check if message content might be flagged as spam
   */
  isSpamContent(text: string): boolean {
    const spamIndicators = [
      /urgente/i,
      /oferta/i,
      /descuento/i,
      /gratis/i,
      /promoción/i,
      /llamar ahora/i,
      /actúa ya/i,
      /no pierdas/i,
      /última oportunidad/i,
      /solo hoy/i
    ];

    return spamIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Get human-like message variations
   */
  getMessageVariations(baseMessage: string): string[] {
    const variations = [
      baseMessage,
      `Hola! ${baseMessage}`,
      `Hola, ${baseMessage}`,
      `${baseMessage} 😊`,
      `Hola! ${baseMessage} 😊`
    ];

    return variations;
  }

  /**
   * Track user interaction for compliance
   */
  trackUserInteraction(botId: string, userId: string, action: 'message' | 'seen' | 'typing'): void {
    const key = `${botId}_${userId}`;
    const now = Date.now();
    const interaction = this.userInteractions.get(key) || {
      lastMessageTime: 0,
      messageCount: 0,
      isTyping: false,
      lastSeenTime: 0
    };

    switch (action) {
      case 'message':
        interaction.lastMessageTime = now;
        interaction.messageCount++;
        break;
      case 'seen':
        interaction.lastSeenTime = now;
        break;
      case 'typing':
        interaction.isTyping = true;
        break;
    }

    this.userInteractions.set(key, interaction);
  }

  /**
   * Check if user is currently typing
   */
  isUserTyping(botId: string, userId: string): boolean {
    const key = `${botId}_${userId}`;
    const interaction = this.userInteractions.get(key);
    return interaction?.isTyping || false;
  }

  /**
   * Stop typing indicator for user
   */
  stopTyping(botId: string, userId: string): void {
    const key = `${botId}_${userId}`;
    const interaction = this.userInteractions.get(key);
    if (interaction) {
      interaction.isTyping = false;
      this.userInteractions.set(key, interaction);
    }
  }

  /**
   * Get compliance statistics for monitoring
   */
  getComplianceStats(): {
    totalUsers: number;
    activeUsers: number;
    rateLimitedUsers: number;
  } {
    const now = Date.now();
    let activeUsers = 0;
    let rateLimitedUsers = 0;

    for (const [key, rate] of this.messageRates.entries()) {
      if (now - rate.windowStart <= this.RATE_LIMIT_WINDOW) {
        activeUsers++;
        if (rate.count >= this.MAX_MESSAGES_PER_HOUR) {
          rateLimitedUsers++;
        }
      }
    }

    return {
      totalUsers: this.userInteractions.size,
      activeUsers,
      rateLimitedUsers
    };
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (this.RATE_LIMIT_WINDOW * 2); // Keep data for 2 hours

    // Clean up old rate limits
    for (const [rateKey, rate] of this.messageRates.entries()) {
      if (rate.windowStart < cutoff) {
        this.messageRates.delete(rateKey);
      }
    }

    // Clean up old user interactions
    for (const [key, interaction] of this.userInteractions.entries()) {
      if (interaction.lastMessageTime < cutoff && interaction.lastSeenTime < cutoff) {
        this.userInteractions.delete(key);
      }
    }
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const complianceService = new ComplianceService();
