import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // XMTP Configuration (using standard XMTP environment variables)
  xmtp: {
    network: process.env.XMTP_ENV || 'dev',
    botWalletPrivateKey: process.env.XMTP_WALLET_KEY,
    dbEncryptionKey: process.env.XMTP_DB_ENCRYPTION_KEY,
  },

  // Sentient Dobby API Configuration (Fireworks AI)
  sentientDobby: {
    apiUrl: 'https://api.fireworks.ai/inference/v1',
    apiKey: process.env.MODEL_API_KEY, // Using the same key name as the Python implementation
    model: 'accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new',
  },

  // Fallback Model Configuration
  fallback: {
    apiUrl: process.env.FALLBACK_API_URL,
    apiKey: process.env.FALLBACK_API_KEY,
    model: process.env.FALLBACK_MODEL || 'gpt-3.5-turbo',
  },

  // Bot Configuration
  bot: {
    persona: process.env.BOT_PERSONA || 'dr-dobby',
    maxContextLength: parseInt(process.env.MAX_CONTEXT_LENGTH) || 4000,
    maxRepliesPerHour: parseInt(process.env.MAX_REPLIES_PER_HOUR) || 50,
    replyTimeoutMs: parseInt(process.env.REPLY_TIMEOUT_MS) || 30000,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/dr-dobby.log',
  },

  // Test Configuration
  test: {
    address: process.env.TEST_ADDRESS || '0xc329b69836331474d183462ccc5128a492bc0bb7',
  },
};

// Validation
if (!config.xmtp.botWalletPrivateKey) {
  throw new Error('XMTP_WALLET_KEY is required');
}

if (!config.sentientDobby.apiKey) {
  throw new Error('MODEL_API_KEY is required');
}

