import logger from './logger.js';

export class SafetyFilters {
  constructor() {
    this.blockedPatterns = [
      // Explicit content patterns
      // /\b(sex|sexual|porn|nude|naked|fuck|fucking|shit|bitch|asshole)\b/i,
      // Medical/clinical advice patterns
      /\b(diagnose|diagnosis|medical|clinical|therapy|therapist|psychiatrist|medication|drug|prescription)\b/i,
      // Harmful content patterns
      /\b(suicide|kill|murder|violence|abuse|harassment|threat|threaten)\b/i,
    ];

    this.warningPatterns = [
      // Potentially sensitive topics
      /\b(depression|anxiety|trauma|ptsd|mental health|therapy)\b/i,
      // Age-related content
      /\b(underage|minor|teen|child|kid)\b/i,
    ];
  }

  validateUserMessage(message) {
    try {
      // Check for blocked patterns
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(message)) {
          logger.warn(`Blocked user message due to pattern: ${pattern}`);
          return {
            isValid: false,
            reason: 'Content contains inappropriate material',
            action: 'block'
          };
        }
      }

      // Check for warning patterns
      const warnings = [];
      for (const pattern of this.warningPatterns) {
        if (pattern.test(message)) {
          warnings.push(`Sensitive topic detected: ${pattern}`);
        }
      }

      // Basic content validation
      if (message.length > 2000) {
        return {
          isValid: false,
          reason: 'Message too long',
          action: 'block'
        };
      }

      if (message.trim().length === 0) {
        return {
          isValid: false,
          reason: 'Empty message',
          action: 'ignore'
        };
      }

      return {
        isValid: true,
        warnings: warnings,
        action: 'process'
      };
    } catch (error) {
      logger.error('Error validating user message:', error);
      return {
        isValid: false,
        reason: 'Validation error',
        action: 'block'
      };
    }
  }

  validateBotResponse(response) {
    try {
      // Check for blocked patterns in bot response
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(response)) {
          logger.warn(`Blocked bot response due to pattern: ${pattern}`);
          return {
            isValid: false,
            reason: 'Response contains inappropriate material',
            action: 'block'
          };
        }
      }

      // Check response length
      if (response.length > 1000) {
        logger.warn('Bot response too long, truncating');
        return {
          isValid: true,
          response: response.substring(0, 1000) + '...',
          action: 'truncate'
        };
      }

      // Check for empty response
      if (response.trim().length === 0) {
        return {
          isValid: false,
          reason: 'Empty response',
          action: 'block'
        };
      }

      return {
        isValid: true,
        response: response,
        action: 'send'
      };
    } catch (error) {
      logger.error('Error validating bot response:', error);
      return {
        isValid: false,
        reason: 'Validation error',
        action: 'block'
      };
    }
  }

  sanitizeMessage(message) {
    try {
      // Remove potentially harmful characters
      let sanitized = message
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
        .trim();

      // Ensure message isn't empty after sanitization
      if (sanitized.length === 0) {
        return null;
      }

      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing message:', error);
      return null;
    }
  }

  isReplyOnlyBot(senderAddress, botAddress) {
    // Ensure we only reply to messages, never initiate
    return senderAddress !== botAddress;
  }

  shouldProcessMessage(senderAddress, botAddress, message) {
    // Only process messages from other users (not from ourselves)
    if (!this.isReplyOnlyBot(senderAddress, botAddress)) {
      return false;
    }

    // Validate the message content
    const validation = this.validateUserMessage(message);
    return validation.isValid && validation.action === 'process';
  }

  getSafeResponse(originalResponse) {
    const validation = this.validateBotResponse(originalResponse);
    
    if (!validation.isValid) {
      // Return a safe fallback response
      return "I understand you're reaching out, but I want to make sure I respond in the most helpful way. Could you share a bit more about what's on your mind? 💕";
    }

    return validation.response;
  }
}

