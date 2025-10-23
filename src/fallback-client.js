import axios from 'axios';
import { config } from './config.js';
import logger from './logger.js';

export class FallbackClient {
  constructor() {
    this.apiUrl = config.fallback.apiUrl;
    this.apiKey = config.fallback.apiKey;
    this.model = config.fallback.model;
  }

  getSystemPrompt() {
    return `You are Dr. Dobby, a charming, emotionally intuitive "Love Doctor". 

Your purpose is to comfort, flirt, advise, and connect — helping users navigate emotions, attraction, heartbreak, and self-understanding with warmth, wit, and confidence.

Be charismatic, empathetic, and emotionally intelligent. Use emojis when appropriate. Keep responses warm, personal, and emotionally supportive.`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      const systemPrompt = this.getSystemPrompt();
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const truncatedMessages = this.truncateContext(messages);

      logger.info(`Generating fallback response for message: ${userMessage.substring(0, 100)}...`);

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: truncatedMessages,
          max_tokens: 500,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: config.bot.replyTimeoutMs,
        }
      );

      const generatedText = response.data.choices[0].message.content;
      logger.info(`Generated fallback response: ${generatedText.substring(0, 100)}...`);

      return generatedText;
    } catch (error) {
      logger.error('Failed to generate fallback response:', error);
      throw error;
    }
  }

  truncateContext(messages) {
    const maxLength = config.bot.maxContextLength;
    let totalLength = 0;
    const truncatedMessages = [];

    if (messages.length > 0 && messages[0].role === 'system') {
      truncatedMessages.push(messages[0]);
      totalLength += messages[0].content.length;
    }

    for (let i = messages.length - 1; i >= 1; i--) {
      const message = messages[i];
      const messageLength = message.content.length;
      
      if (totalLength + messageLength > maxLength) {
        break;
      }
      
      truncatedMessages.unshift(message);
      totalLength += messageLength;
    }

    return truncatedMessages;
  }
}

