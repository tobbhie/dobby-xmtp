# Dr. Dobby XMTP Agent

A charming, emotionally intuitive "Love Doctor" XMTP agent powered by Sentient Dobby Unhinged model. Dr. Dobby helps users navigate emotions, attraction, heartbreak, and self-understanding with warmth, wit, and confidence.

## Features

- **AI-Powered**: Uses Sentient Dobby Unhinged model for emotionally intelligent responses
- **Privacy-Friendly**: End-to-end encrypted messaging through XMTP
- **Reply-Only Bot**: Responds to messages but never initiates conversations
- **Safety Filters**: Content validation and safety measures
- **Rate Limiting**: Prevents spam and manages resource usage
- **Fallback Support**: Graceful degradation when primary AI model fails
- **Browser DevTools Compatible**: Works with XMTP Browser Developer Tools
- **Rich Content Support**: Handles attachments, reactions, and replies
- **Group Message Awareness**: Dr. Dobby prefers private conversations for love advice
- **Agent SDK**: Built with XMTP Agent SDK for standardized patterns

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# XMTP Configuration (Standard XMTP Environment Variables)
XMTP_WALLET_KEY=your_bot_wallet_private_key_here
XMTP_DB_ENCRYPTION_KEY=your_encryption_key_here
XMTP_ENV=dev

# Sentient Dobby API Configuration (Fireworks AI)
MODEL_API_KEY=your_fireworks_ai_api_key_here

# Optional Fallback Model
FALLBACK_API_URL=https://api.openai.com/v1
FALLBACK_API_KEY=your_fallback_api_key_here
FALLBACK_MODEL=gpt-3.5-turbo

# Bot Configuration
MAX_REPLIES_PER_HOUR=50
MAX_CONTEXT_LENGTH=4000
LOG_LEVEL=info
```

### 3. Run the Agent

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Configuration

### Required Environment Variables

- `XMTP_WALLET_KEY`: Private key for the bot wallet (standard XMTP variable)
- `XMTP_DB_ENCRYPTION_KEY`: Encryption key for local database (standard XMTP variable)
- `XMTP_ENV`: XMTP network environment (dev/production, default: dev)
- `MODEL_API_KEY`: Fireworks AI API key for Sentient Dobby model

### Optional Environment Variables

- `FALLBACK_API_KEY`: Fallback AI model API key
- `MAX_REPLIES_PER_HOUR`: Rate limit per user (default: 50)
- `MAX_CONTEXT_LENGTH`: Maximum context length (default: 4000)
- `LOG_LEVEL`: Logging level (default: info)

## Usage

### Testing with XMTP Browser DevTools

1. Start the Dr. Dobby agent
2. Open XMTP Browser DevTools
3. Connect with a test wallet
4. Send a message to the bot's address
5. Dr. Dobby will respond with emotionally intelligent advice

### Rich Content Features

Dr. Dobby now supports:
- **Attachments**: Responds charmingly to images and files
- **Reactions**: Can react back with appropriate emojis
- **Replies**: Maintains conversation context in threaded discussions
- **Group Messages**: Prefers private conversations for love advice

### Bot Persona

Dr. Dobby is designed to be:
- **Charismatic**: Charming and emotionally intuitive
- **Empathetic**: Reads between the lines of human speech
- **Supportive**: Helps with emotions, attraction, and relationships
- **Boundary-Aware**: Maintains appropriate emotional intimacy
- **Context-Aware**: Handles different content types appropriately

## Architecture

```
User Message → XMTP Network → Agent SDK → Dr. Dobby Agent → Sentient Dobby LLM → Response → XMTP Network → User
```

### Components

- **Agent SDK**: Standardized XMTP agent framework with event-driven architecture
- **Dr. Dobby Agent**: Main agent class with personality and AI integration
- **Sentient Dobby Client**: Connects to the real Sentient Dobby Unhinged model
- **Safety Filters**: Validates content and ensures appropriate responses
- **Conversation Manager**: Manages conversation history and rate limiting
- **Fallback Client**: Provides backup when primary model fails
- **Content Type Handlers**: Support for attachments, reactions, and replies

## Safety & Privacy

- **Content Filtering**: Blocks inappropriate content
- **Rate Limiting**: Prevents spam and abuse
- **Privacy-First**: No data collection beyond conversation context
- **Reply-Only**: Never initiates conversations
- **Graceful Degradation**: Continues working even when AI models fail

## Deployment

### Local Development

```bash
npm run dev
```

### Production Deployment

1. Set up environment variables
2. Install dependencies: `npm install`
3. Start the service: `npm start`
4. Monitor logs for any issues

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

## Monitoring

The agent logs important events including:
- Message processing
- API calls
- Rate limiting
- Errors and fallbacks
- Connection status

Check logs for monitoring and debugging.

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: 
   - `XMTP_WALLET_KEY` is required
   - `XMTP_DB_ENCRYPTION_KEY` is required
   - `MODEL_API_KEY` is required

2. **Wallet Connection Failed**: Check private key format and network
3. **API Connection Failed**: Verify Fireworks AI API key and endpoints
4. **Rate Limited**: Adjust `MAX_REPLIES_PER_HOUR` setting
5. **Memory Issues**: Reduce `MAX_CONTEXT_LENGTH`

### Debug Mode

Set `LOG_LEVEL=debug` for detailed logging.

### Generate Encryption Key

If you need to generate a new encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
## Contributing

This is a specialized XMTP agent for Dr. Dobby. For modifications:

1. Update the persona in `src/sentient-dobby.js`
2. Modify safety filters in `src/safety-filters.js`
3. Adjust rate limiting in `src/conversation-manager.js`
4. Add new content type handlers in `src/dobby-agent.js`

## License

MIT License - Feel free to use and modify for your own XMTP agents.
