import { Agent } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import { SentientDobbyClient } from "./sentient-dobby.js";
import { FallbackClient } from "./fallback-client.js";
import { SafetyFilters } from "./safety-filters.js";
import { ConversationManager } from "./conversation-manager.js";
import { config } from "./config.js";
import logger from "./logger.js";

export class DrDobbyAgent {
  constructor() {
    this.agent = null;
    this.sentientDobby = new SentientDobbyClient();
    this.fallbackClient = new FallbackClient();
    this.safetyFilters = new SafetyFilters();
    this.conversationManager = new ConversationManager();
    this.cleanupInterval = null;
  }

  async initialize() {
    try {
      logger.info("Initializing Dr. Dobby XMTP Agent...");

      if (!process.env.XMTP_WALLET_KEY) {
        throw new Error("Missing XMTP_WALLET_KEY in environment variables");
      }

      this.agent = await Agent.createFromEnv({
        env: process.env.XMTP_ENV || "dev",
      });

      const connections = await this.testConnections();
      logger.info("AI Model Connection Status:", connections);

      if (!connections.sentientDobby && !connections.fallback) {
        throw new Error("No working AI models available");
      }

      this.setupEventHandlers();

      logger.info("✅ Dr. Dobby Agent initialized successfully");
      return this.agent;
    } catch (error) {
      logger.error("❌ Failed to initialize Dr. Dobby agent:", error);
      throw error;
    }
  }

  setupEventHandlers() {
    const safeHandler = (fn, label) => async (ctx) => {
      try {
        await Promise.resolve(fn.call(this, ctx));
      } catch (err) {
        logger.error(`Error in ${label} handler:`, err);
      }
    };

    this.agent.on("text", safeHandler(this.handleTextMessage, "text"));
    this.agent.on("attachment", safeHandler(this.handleAttachment, "attachment"));
    this.agent.on("reaction", safeHandler(this.handleReaction, "reaction"));
    this.agent.on("group", safeHandler(this.handleGroupMessage, "group"));

    this.agent.on("start", () => {
      logger.info("💖 Dr. Dobby is online and ready to heal hearts!");
      logger.info(`💌 XMTP Address: ${this.agent.address}`);
      logger.info(`🔗 Test URL: ${getTestUrl(this.agent.client)}`);
      logger.info(`🧪 Test address: ${config.test.address}`);
    });

    this.agent.on("stop", () => {
      logger.info("👋 Dr. Dobby is signing off. Remember, love always wins!");
    });

    this.agent.on("unhandledError", (error) => {
      logger.error("Unhandled XMTP agent error:", error);
    });
  }

  async handleTextMessage(ctx) {
    const messageContent = ctx.message.content;
    const senderAddress = await ctx.getSenderAddress();
    const conversationId = ctx.conversation.topic;

    logger.info(`💬 Message from ${senderAddress}: ${messageContent}`);

    const shouldProcess = this.conversationManager.shouldProcessMessage(
      conversationId,
      senderAddress,
      messageContent
    );

    if (!shouldProcess.shouldProcess) {
      if (shouldProcess.response) await ctx.sendText(shouldProcess.response);
      return;
    }

    const validation = this.safetyFilters.validateUserMessage(messageContent);
    if (!validation.isValid) {
      logger.warn(`Message blocked from ${senderAddress}: ${validation.reason}`);
      return;
    }

    this.conversationManager.addMessageToHistory(conversationId, "user", messageContent);
    const conversationHistory = this.conversationManager.getConversationContext(conversationId);

    let response;
    try {
      response = await this.sentientDobby.generateResponse(messageContent, conversationHistory);
    } catch (error) {
      logger.error("Sentient Dobby failed, switching to fallback:", error);
      if (config.fallback.apiKey) {
        try {
          response = await this.fallbackClient.generateResponse(messageContent, conversationHistory);
        } catch (fallbackError) {
          logger.error("Fallback model also failed:", fallbackError);
          response = this.getEmergencyResponse();
        }
      } else {
        response = this.getEmergencyResponse();
      }
    }

    const safeResponse = this.safetyFilters.getSafeResponse(response);
    if (safeResponse) {
      this.conversationManager.addMessageToHistory(conversationId, "assistant", safeResponse);
      this.conversationManager.recordReply(senderAddress);
      await ctx.sendText(safeResponse);
      logger.info(`💞 Response sent to ${senderAddress}: ${safeResponse.substring(0, 120)}...`);
    } else {
      logger.warn(`No safe response for ${senderAddress}`);
    }
  }

  async handleAttachment(ctx) {
    const senderAddress = await ctx.getSenderAddress();
    logger.info(`📎 Attachment from ${senderAddress}`);
    await ctx.sendText(
      "Oh, you're sharing something with me! 💕 I can't see images, but I'd love to hear about it. What’s on your mind?"
    );
  }

  async handleReaction(ctx) {
    const senderAddress = await ctx.getSenderAddress();
    const reaction = ctx.message.content;
    logger.info(`💫 Reaction ${reaction} from ${senderAddress}`);

    if (reaction === "❤️" || reaction === "💕" || reaction === "😍") {
      await ctx.sendReaction?.("💕");
    } else if (reaction === "😢" || reaction === "😭") {
      await ctx.sendReaction?.("🤗");
    } else {
      await ctx.sendReaction?.("💖");
    }
  }

  async handleGroupMessage(ctx) {
    const messageContent = ctx.message.content;
    const senderAddress = await ctx.getSenderAddress();
    logger.info(`👥 Group message from ${senderAddress}: ${messageContent}`);

    if (messageContent.toLowerCase().includes("dobby") || messageContent.toLowerCase().includes("love")) {
      await ctx.sendText(
        "Hey there! 💕 I'd love to chat about love and relationships, but let's keep those private. DM me, and I'll be your Love Doctor! 💌"
      );
    }
  }

  async testConnections() {
    logger.info("Testing AI model connections...");
    const sentientDobbyWorking = await this.sentientDobby.testConnection();
    logger.info(`Sentient Dobby connection: ${sentientDobbyWorking ? "OK" : "FAILED"}`);
    return {
      sentientDobby: sentientDobbyWorking,
      fallback: !!config.fallback.apiKey,
    };
  }

  getEmergencyResponse() {
    const responses = [
      "I'm feeling a bit overwhelmed right now, but I'm still here for you. 💕",
      "Something's not quite right in my circuits, but I'm listening. 💕",
      "I'm having a moment of confusion, but I still care. What's on your heart? 💞",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async start() {
    try {
      await this.initialize();
      await this.agent.start();
      this.setupPeriodicCleanup();

      // logger.info("💖 Dr. Dobby is now online and ready to heal hearts!");

      // await new Promise(() => {});
    } catch (error) {
      logger.error("❌ Failed to start Dr. Dobby agent:", error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info("🛑 Stopping Dr. Dobby agent...");
      if (this.cleanupInterval) clearInterval(this.cleanupInterval);
      await this.agent?.stop();
      this.conversationManager.cleanup();
      logger.info("✅ Dr. Dobby stopped gracefully.");
    } catch (error) {
      logger.error("Error during Dr. Dobby shutdown:", error);
    }
  }

  setupPeriodicCleanup() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => {
      this.conversationManager.cleanup();
      logger.info("🧹 Dr. Dobby performed periodic cleanup");
    }, 60 * 60 * 1000); // every hour
  }

  getStatus() {
    return {
      isRunning: !!this.agent,
      address: this.agent?.address,
      //stats: this.conversationManager.getStats(),
      network: process.env.XMTP_ENV || "dev",
    };
  }
}
