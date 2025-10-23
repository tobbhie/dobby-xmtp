import { Client } from '@xmtp/xmtp-js';
import { BotWallet } from './wallet.js';
import { config } from './config.js';
import logger from './logger.js';

export class XMTPClient {
  constructor() {
    this.client = null;
    this.wallet = new BotWallet();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.wallet.initialize();
      
      const wallet = this.wallet.getWallet();
      const address = this.wallet.getAddress();
      
      logger.info(`Initializing XMTP client for ${address} on ${config.xmtp.network} network`);
      
      // Create XMTP client
      this.client = await Client.create(wallet, {
        env: config.xmtp.network === 'production' ? 'production' : 'dev',
      });

      this.isInitialized = true;
      logger.info('XMTP client initialized successfully');
      
      return this.client;
    } catch (error) {
      logger.error('Failed to initialize XMTP client:', error);
      throw error;
    }
  }

  async startListening() {
    if (!this.isInitialized) {
      throw new Error('XMTP client not initialized. Call initialize() first.');
    }

    try {
      logger.info('Starting XMTP message listener...');
      
      // Subscribe to all conversations
      for await (const conversation of this.client.conversations.list()) {
        await this.setupConversationListener(conversation);
      }

      // Listen for new conversations
      this.client.conversations.on('conversation', async (conversation) => {
        await this.setupConversationListener(conversation);
      });

      logger.info('XMTP message listener started successfully');
    } catch (error) {
      logger.error('Failed to start XMTP listener:', error);
      throw error;
    }
  }

  async setupConversationListener(conversation) {
    try {
      logger.info(`Setting up listener for conversation with ${conversation.peerAddress}`);
      
      // Listen for new messages in this conversation
      for await (const message of await conversation.messages()) {
        await this.handleMessage(conversation, message);
      }
    } catch (error) {
      logger.error(`Failed to setup conversation listener for ${conversation.peerAddress}:`, error);
    }
  }

  async handleMessage(conversation, message) {
    try {
      // Skip messages from ourselves
      if (message.senderAddress === this.wallet.getAddress()) {
        return;
      }

      logger.info(`Received message from ${message.senderAddress}: ${message.content}`);

      // Import the message handler
      const { handleIncomingMessage } = await import('./message-handler.js');
      await handleIncomingMessage(conversation, message);
    } catch (error) {
      logger.error('Failed to handle message:', error);
    }
  }

  async sendMessage(conversation, content) {
    try {
      if (!this.isInitialized) {
        throw new Error('XMTP client not initialized');
      }

      logger.info(`Sending message to ${conversation.peerAddress}: ${content}`);
      
      await conversation.send(content);
      logger.info('Message sent successfully');
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async getConversation(peerAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('XMTP client not initialized');
      }

      const conversation = await this.client.conversations.newConversation(peerAddress);
      return conversation;
    } catch (error) {
      logger.error(`Failed to get conversation with ${peerAddress}:`, error);
      throw error;
    }
  }

  getClient() {
    if (!this.isInitialized) {
      throw new Error('XMTP client not initialized');
    }
    return this.client;
  }

  getWalletAddress() {
    return this.wallet.getAddress();
  }
}

