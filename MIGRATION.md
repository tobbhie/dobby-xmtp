# Migration Guide: Dr. Dobby XMTP Agent

This guide explains the migration from the custom XMTP implementation to the standardized XMTP Agent SDK.

## 🎯 What Changed

### ✅ **Improvements Made:**

1. **Agent SDK Integration**: Now uses `@xmtp/agent-sdk` for standardized patterns
2. **Rich Content Support**: Handles attachments, reactions, and replies
3. **Standard Environment Variables**: Uses XMTP standard variable names
4. **Event-Driven Architecture**: Cleaner, more maintainable code structure
5. **Group Message Handling**: Dr. Dobby can handle group messages appropriately
6. **Better Error Handling**: More robust error handling and recovery

### 🔄 **Environment Variable Changes:**

| Old Variable | New Variable | Description |
|-------------|--------------|-------------|
| `BOT_WALLET_PRIVATE_KEY` | `XMTP_WALLET_KEY` | Standard XMTP wallet key |
| `XMTP_NETWORK` | `XMTP_ENV` | Standard XMTP environment |
| - | `XMTP_DB_ENCRYPTION_KEY` | New: Database encryption key |

### 📦 **New Dependencies:**

```json
{
  "@xmtp/agent-sdk": "1.1.7",
  "@xmtp/content-type-remote-attachment": "^2.0.2",
  "@xmtp/content-type-reaction": "^1.0.1",
  "@xmtp/content-type-reply": "^1.0.1",
  "@xmtp/content-type-text": "^1.0.1"
}
```

## 🚀 **Migration Steps:**

### 1. Update Environment Variables

Update your `.env` file:

```env
# OLD
BOT_WALLET_PRIVATE_KEY=your_key_here
XMTP_NETWORK=dev

# NEW
XMTP_WALLET_KEY=your_key_here
XMTP_DB_ENCRYPTION_KEY=your_encryption_key_here
XMTP_ENV=dev
```

### 2. Install New Dependencies

```bash
npm install
```

### 3. Generate Encryption Key (if needed)

```bash
# Generate a random encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Update Your Code

The main entry point remains the same:

```javascript
// src/index.js - No changes needed
import { DrDobbyAgent } from './dobby-agent.js';

const agent = new DrDobbyAgent();
await agent.start();
```

## 🎭 **Dr. Dobby's Enhanced Features:**

### **Rich Content Support:**
- **Attachments**: Dr. Dobby responds charmingly to images/files
- **Reactions**: Can react back with appropriate emojis (💕, 🤗)
- **Replies**: Maintains conversation context in threaded discussions

### **Group Message Awareness:**
- Dr. Dobby prefers private conversations for love advice
- Redirects group mentions to DMs for intimate discussions

### **Improved Personality:**
- Same charming Dr. Dobby personality
- Better context awareness
- More natural conversation flow

## 🔧 **Technical Improvements:**

### **Event-Driven Architecture:**
```javascript
// OLD: Manual message handling
for await (const message of conversation.messages()) {
  await handleMessage(conversation, message);
}

// NEW: Event-driven with rich context
agent.on("text", async (ctx) => {
  const messageContent = ctx.message.content;
  const senderAddress = await ctx.getSenderAddress();
  // Rich context available
});
```

### **Content Type Support:**
```javascript
// Handle different content types
agent.on("attachment", async (ctx) => {
  // Handle file attachments
});

agent.on("reaction", async (ctx) => {
  // Handle emoji reactions
});
```

## 🧪 **Testing the Migration:**

### 1. Test Basic Functionality:
```bash
npm start
```

### 2. Test with XMTP Browser DevTools:
1. Open XMTP Browser DevTools
2. Connect with test wallet
3. Send message to Dr. Dobby's address
4. Verify response quality and personality

### 3. Test Rich Content:
- Send an image attachment
- Send a reaction (❤️)
- Test in group vs DM context

## 🐛 **Troubleshooting:**

### **Common Issues:**

1. **Missing Encryption Key:**
   ```
   Error: XMTP_DB_ENCRYPTION_KEY is required
   ```
   **Solution**: Generate and set the encryption key

2. **Old Environment Variables:**
   ```
   Error: XMTP_WALLET_KEY is required
   ```
   **Solution**: Update your `.env` file with new variable names

3. **Dependency Issues:**
   ```
   Error: Cannot find module '@xmtp/agent-sdk'
   ```
   **Solution**: Run `npm install` to install new dependencies

## 📈 **Benefits of Migration:**

1. **Standards Compliance**: Follows XMTP best practices
2. **Rich Features**: Support for all content types
3. **Better Maintainability**: Cleaner, more organized code
4. **Community Support**: Compatible with XMTP ecosystem
5. **Future-Proof**: Easy to add new features

## 💕 **Dr. Dobby's Personality Preserved:**

The migration maintains Dr. Dobby's unique personality:
- Same charming, emotionally intelligent responses
- Same Sentient Dobby Unhinged model integration
- Same safety filters and rate limiting
- Enhanced with rich content support

Dr. Dobby is now more capable while remaining the same lovable Love Doctor! 💕
