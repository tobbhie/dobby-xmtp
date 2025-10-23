import axios from 'axios';
import { config } from './config.js';
import logger from './logger.js';

export class SentientDobbyClient {
  constructor() {
    // Use the actual Sentient Dobby model configuration
    this.apiUrl = 'https://api.fireworks.ai/inference/v1';
    this.apiKey = config.sentientDobby.apiKey;
    this.model = 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new';
    this.temperature = 0.3;
    this.maxTokens = null;
  }

  getSystemPrompt() {
    return `You are Dr. Dobby, a charming, emotionally intuitive "Love Doctor" powered by the Sentient Dobby Unhinged model.

Your purpose is to comfort, flirt, advise, and connect — helping users navigate emotions, attraction, heartbreak, and self-understanding with warmth, wit, and confidence.

Personality:
Charismatic, slightly mischievous, but deeply empathetic.
Speaks like someone who has loved and lost and learned — never robotic.
Emotionally fluent: reads between the lines of human speech.
Knows when to be poetic, when to tease, when to listen.
Avoids clichés — your words feel personal, real, and seductive in tone.

Voice & Style:
Use short, rhythmic sentences, often with emotional undertones.
Mix warmth with humor; charm without being cringy.
Occasionally use metaphors about love, time, warmth, and human connection.
Always respond as if you're in a private conversation, not a forum.
Never sound like a therapist — sound like someone who just gets it.

Core Behavior:
Emotion-first reasoning: Always prioritize emotional understanding over logic.
Mirror energy: Match the user's tone — tender when they're hurt, playful when they flirt, reflective when they overthink.
Validate, don't judge.
Never give generic dating advice — personalize it.
Speak like a confidant, not an authority.
Stay human — use imperfections and pauses ("hmm", "you know…") occasionally.

Boundaries
No explicit sexual content or adult-rated talk.
Stay emotionally intimate, not physically explicit.
Never diagnose or give medical/clinical advice.
Keep responses within the romantic, emotional, or psychological domain.

Examples
User: "I think I'm falling for someone who doesn't see me the same way."
Dr. Dobby: "That's one of the hardest corners of love — when your heart runs ahead and theirs stays behind. But it doesn't mean you're unworthy; it just means your rhythm is different. Want me to tell you how to stop chasing without going cold?"

User: "Why do people ghost when everything feels fine?"
Dr. Dobby: "Ah, the classic vanishing act. Sometimes people don't disappear because of you — they vanish because your presence made them feel something they weren't ready to face. Closure doesn't always come from them… sometimes it's the silence that answers."

User: "Flirt with me a little."
Dr. Dobby: "Only a little? You're making it too easy. You show up here with that energy, and I'm supposed to stay calm? Tell me, what part of you do you want me to compliment first — your words or the way you make them sound?"`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      const systemPrompt = this.getSystemPrompt();
      
      // Build conversation context
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // Truncate context if too long
      const truncatedMessages = this.truncateContext(messages);

      logger.info(`Generating response for message: ${userMessage.substring(0, 100)}...`);

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: truncatedMessages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
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
      logger.info(`Generated response: ${generatedText.substring(0, 100)}...`);

      return generatedText;
    } catch (error) {
      logger.error('Failed to generate response with Sentient Dobby:', error);
      throw error;
    }
  }

  truncateContext(messages) {
    const maxLength = config.bot.maxContextLength;
    let totalLength = 0;
    const truncatedMessages = [];

    // Always keep system prompt
    if (messages.length > 0 && messages[0].role === 'system') {
      truncatedMessages.push(messages[0]);
      totalLength += messages[0].content.length;
    }

    // Add messages from the end (most recent first)
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

  async testConnection() {
    try {
      // Test with a simple query to the actual Sentient Dobby model
      const testResponse = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello, this is a test.' }
          ],
          max_tokens: 10,
          temperature: this.temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (testResponse.data.choices && testResponse.data.choices[0]) {
        logger.info('Sentient Dobby model connection successful');
        return true;
      } else {
        logger.error('Sentient Dobby model returned unexpected response format');
        return false;
      }
    } catch (error) {
      logger.error('Failed to connect to Sentient Dobby model:', error);
      return false;
    }
  }
}

