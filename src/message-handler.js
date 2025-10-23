import { SentientDobbyClient } from './sentient-dobby.js';
import { FallbackClient } from './fallback-client.js';
import { SafetyFilters } from './safety-filters.js';
import { ConversationManager } from './conversation-manager.js';
import { config } from './config.js';
import logger from './logger.js';

export class MessageHandler {
  constructor() {
    this.sentientDobby = new SentientDobbyClient();
    this.fallbackClient = new FallbackClient();
    this.safetyFilters = new SafetyFilters();
    this.conversationManager = new ConversationManager();
  }

  async handleIncomingMessage(conversation, message) {
    try {
      const conversationId = conversation.peerAddress;
      const userAddress = message.senderAddress;
      const userMessage = message.content;

      logger.info(`Handling message from ${userAddress}: ${userMessage}`);

      // Check if we should process this message
      const shouldProcess = this.conversationManager.shouldProcessMessage(
        conversationId, 
        userAddress, 
        userMessage
      );

      if (!shouldProcess.shouldProcess) {
        if (shouldProcess.response) {
          await conversation.send(shouldProcess.response);
        }
        return;
      }

      // Validate message with safety filters
      const validation = this.safetyFilters.validateUserMessage(userMessage);
      if (!validation.isValid) {
        logger.warn(`Blocked message from ${userAddress}: ${validation.reason}`);
        return;
      }

      // Add user message to conversation history
      this.conversationManager.addMessageToHistory(conversationId, 'user', userMessage);

      // Get conversation context
      const conversationHistory = this.conversationManager.getConversationContext(conversationId);

      // Generate response using Sentient Dobby
      let response;
      try {
        response = await this.sentientDobby.generateResponse(userMessage, conversationHistory);
      } catch (error) {
        logger.error('Sentient Dobby failed, trying fallback:', error);
        
        // Try fallback model if available
        if (config.fallback.apiKey) {
          try {
            response = await this.fallbackClient.generateResponse(userMessage, conversationHistory);
          } catch (fallbackError) {
            logger.error('Fallback model also failed:', fallbackError);
            response = this.getEmergencyResponse();
          }
        } else {
          response = this.getEmergencyResponse();
        }
      }

      // Validate and sanitize response
      const safeResponse = this.safetyFilters.getSafeResponse(response);
      
      if (safeResponse) {
        // Add bot response to conversation history
        this.conversationManager.addMessageToHistory(conversationId, 'assistant', safeResponse);
        
        // Record the reply for rate limiting
        this.conversationManager.recordReply(userAddress);
        
        // Send the response
        await conversation.send(safeResponse);
        
        logger.info(`Sent response to ${userAddress}: ${safeResponse.substring(0, 100)}...`);
      } else {
        logger.warn(`Failed to generate safe response for ${userAddress}`);
      }

    } catch (error) {
      logger.error('Error handling message:', error);
      
      // Send a graceful error response
      try {
        await conversation.send("I'm having a little trouble processing that right now. Give me a moment to collect my thoughts, and I'll be back to chat soon! 💕");
      } catch (sendError) {
        logger.error('Failed to send error response:', sendError);
      }
    }
  }

  getEmergencyResponse() {
    const emergencyResponses = [
      "I'm feeling a bit overwhelmed right now, but I'm here for you. Could you tell me more about what's on your mind? 💕",
      "Something's not quite right with my thoughts today. But I'm still listening - what's going on in your world? 💕",
      "I'm having a moment of confusion, but I want to be here for you. What's on your heart today? 💕"
    ];
    
    return emergencyResponses[Math.floor(Math.random() * emergencyResponses.length)];
  }

  async testConnections() {
    logger.info('Testing API connections...');
    
    // Test Sentient Dobby connection
    const sentientDobbyWorking = await this.sentientDobby.testConnection();
    logger.info(`Sentient Dobby connection: ${sentientDobbyWorking ? 'OK' : 'FAILED'}`);
    
    return {
      sentientDobby: sentientDobbyWorking,
      fallback: !!config.fallback.apiKey
    };
  }

  getStats() {
    return {
      activeConversations: this.conversationManager.conversations.size,
      rateLimitedUsers: this.conversationManager.rateLimits.size,
      maxRepliesPerHour: config.bot.maxRepliesPerHour
    };
  }

  cleanup() {
    this.conversationManager.cleanup();
  }
}

// Export the handler function for XMTP client
export async function handleIncomingMessage(conversation, message) {
  const handler = new MessageHandler();
  await handler.handleIncomingMessage(conversation, message);
}
