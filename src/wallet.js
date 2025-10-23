import { ethers } from 'ethers';
import { config } from './config.js';
import logger from './logger.js';

export class BotWallet {
  constructor() {
    this.wallet = null;
    this.address = null;
  }

  async initialize() {
    try {
      if (!config.xmtp.botWalletPrivateKey) {
        throw new Error('Bot wallet private key not configured');
      }

      this.wallet = new ethers.Wallet(config.xmtp.botWalletPrivateKey);
      this.address = this.wallet.address;
      
      logger.info(`Bot wallet initialized: ${this.address}`);
      return this.wallet;
    } catch (error) {
      logger.error('Failed to initialize bot wallet:', error);
      throw error;
    }
  }

  getWallet() {
    if (!this.wallet) {
      throw new Error('Bot wallet not initialized. Call initialize() first.');
    }
    return this.wallet;
  }

  getAddress() {
    if (!this.address) {
      throw new Error('Bot wallet not initialized. Call initialize() first.');
    }
    return this.address;
  }

  async signMessage(message) {
    try {
      const wallet = this.getWallet();
      return await wallet.signMessage(message);
    } catch (error) {
      logger.error('Failed to sign message:', error);
      throw error;
    }
  }
}

