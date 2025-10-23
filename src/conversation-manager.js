import logger from './logger.js';
import { config } from './config.js';

export class ConversationManager {
  constructor() {
    this.conversations = new Map(); // Store conversation history
    this.rateLimits = new Map(); // Track rate limits per user
    this.maxRepliesPerHour = config.bot.maxRepliesPerHour;
  }

  getConversationHistory(conversationId) {
    return this.conversations.get(conversationId) || [];
  }

  addMessageToHistory(conversationId, role, content) {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }

    const history = this.conversations.get(conversationId);
    history.push({ role, content, timestamp: Date.now() });

    // Keep only last 20 messages to prevent memory bloat
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversations.set(conversationId, history);
  }

  isRateLimited(userAddress) {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (!this.rateLimits.has(userAddress)) {
      this.rateLimits.set(userAddress, []);
    }

    const userRateLimit = this.rateLimits.get(userAddress);
    
    // Remove old timestamps
    const recentReplies = userRateLimit.filter(timestamp => timestamp > hourAgo);
    this.rateLimits.set(userAddress, recentReplies);

    return recentReplies.length >= this.maxRepliesPerHour;
  }

  recordReply(userAddress) {
    const now = Date.now();
    
    if (!this.rateLimits.has(userAddress)) {
      this.rateLimits.set(userAddress, []);
    }

    const userRateLimit = this.rateLimits.get(userAddress);
    userRateLimit.push(now);
    this.rateLimits.set(userAddress, userRateLimit);
  }

  getRateLimitStatus(userAddress) {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    if (!this.rateLimits.has(userAddress)) {
      return { remaining: this.maxRepliesPerHour, resetTime: now + (60 * 60 * 1000) };
    }

    const userRateLimit = this.rateLimits.get(userAddress);
    const recentReplies = userRateLimit.filter(timestamp => timestamp > hourAgo);
    const remaining = Math.max(0, this.maxRepliesPerHour - recentReplies.length);
    const resetTime = recentReplies.length > 0 ? recentReplies[0] + (60 * 60 * 1000) : now;

    return { remaining, resetTime };
  }

  shouldProcessMessage(conversationId, userAddress, message) {
    // Check rate limiting
    if (this.isRateLimited(userAddress)) {
      logger.warn(`Rate limit exceeded for user ${userAddress}`);
      return {
        shouldProcess: false,
        reason: 'Rate limit exceeded',
        response: "I'm getting a bit overwhelmed with messages right now. Give me a moment to catch up, and I'll be back to chat soon! 💕"
      };
    }

    // Check if message is valid
    if (!message || message.trim().length === 0) {
      return {
        shouldProcess: false,
        reason: 'Empty message',
        response: null
      };
    }

    return {
      shouldProcess: true,
      reason: 'Message approved',
      response: null
    };
  }

  getConversationContext(conversationId) {
    const history = this.getConversationHistory(conversationId);
    
    // Convert to the format expected by the AI model
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  cleanup() {
    // Clean up old conversations and rate limits
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);

    // Clean up old rate limits
    for (const [userAddress, timestamps] of this.rateLimits.entries()) {
      const recentTimestamps = timestamps.filter(timestamp => timestamp > dayAgo);
      if (recentTimestamps.length === 0) {
        this.rateLimits.delete(userAddress);
      } else {
        this.rateLimits.set(userAddress, recentTimestamps);
      }
    }

    // Clean up old conversations
    for (const [conversationId, history] of this.conversations.entries()) {
      const recentMessages = history.filter(msg => msg.timestamp > dayAgo);
      if (recentMessages.length === 0) {
        this.conversations.delete(conversationId);
      } else {
        this.conversations.set(conversationId, recentMessages);
      }
    }

    logger.info('Conversation manager cleanup completed');
  }
}

