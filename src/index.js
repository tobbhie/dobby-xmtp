import { DrDobbyAgent } from "./dobby-agent.js";
import logger from "./logger.js";

async function main() {
  console.log("🚀 Starting Dr. Dobby XMTP Agent...");
  const agent = new DrDobbyAgent();
  let statusInterval;

  try {
    console.log("📡 Initializing agent...");
    await agent.start();
    console.log("✅ Agent started successfully!");

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, Dr. Dobby signing off gracefully...`);
      clearInterval(statusInterval);
      await agent.stop();
      // give logger time to flush
      setTimeout(() => process.exit(0), 1500);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGUSR2", () => shutdown("SIGUSR2"));

    statusInterval = setInterval(() => {
      const status = agent.getStatus();
      logger.info("❤️ Dr. Dobby status:", status);
    }, 5 * 60 * 1000); // every 5 min

  } catch (error) {
    console.error("💥 Fatal error starting Dr. Dobby agent:", error);
    logger.error("💥 Fatal error starting Dr. Dobby agent:", error);
    setTimeout(() => process.exit(1), 1500);
  }
}

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  setTimeout(() => process.exit(1), 1500);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection:", { reason, promise });
  setTimeout(() => process.exit(1), 1500);
});

console.log("🎯 Calling main function...");
main().catch(error => {
  console.error("💥 Unhandled error in main:", error);
  process.exit(1);
});
