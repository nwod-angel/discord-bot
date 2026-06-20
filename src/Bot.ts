// ── Entry Point ──────────────────────────────────────────────────
// This file avoids top-level await for CJS compatibility.
// All async initialization runs inside the main() function.

import * as dotenv from 'dotenv'
dotenv.config(); //initialize dotenv — MUST be before instrumentation import

import { Client, ClientOptions } from "discord.js";
import "./typescript/BitInt"

async function main() {
  // OTel instrumentation MUST be imported after dotenv.config() so env vars are available.
  // Must complete before logger creation so PinoInstrumentation patches pino.
  await import("./instrumentation.js").catch(err => {
    console.error("Failed to load OTel instrumentation:", err);
  });

  const { logger } = await import("./logger.js");
  const { validateApiConfig } = await import("./apiClient.js");

  // Validate API config now that dotenv.config() has run
  validateApiConfig();

  logger.info("Bot is starting...");

  const { default: ready } = await import("./listeners/ready.js");
  const { default: interactionCreate } = await import("./listeners/interactionCreate.js");
  const { default: unhandledRejection } = await import("./listeners/unhandledRejection.js");
  const { default: unhandledException } = await import("./listeners/unhandledException.js");

  const token = process.env['DISCORD_TOKEN']; // add your token here

  // ── API health check on startup ────────────────────────────────

  const USE_API_ROLL = process.env["USE_API_ROLL"] === "true";
  const API_BASE_URL = (process.env["API_BASE_URL"] || "http://localhost:3001").replace(/\/+$/, "");

  async function checkApiHealth(): Promise<void> {
    if (!USE_API_ROLL) {
      logger.debug("USE_API_ROLL is off — API delegation disabled.");
      return;
    }

    const healthUrl = `${API_BASE_URL}/health`;
    logger.debug({ healthUrl }, "USE_API_ROLL is ON — checking API");

    try {
      const res = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        logger.info({ status: res.status }, "API reachable — rolls will be delegated.");
      } else {
        logger.warn({ status: res.status }, "API returned non-OK status — will fall back to local rolls.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ err }, "API unreachable — will fall back to local rolls.");
    }
  }

  checkApiHealth();

  logger.info(`
░   ░░░  ░░  ░░░░  ░░░      ░░░       ░░░       ░░░░      ░░░        ░
▒    ▒▒  ▒▒  ▒  ▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒▒▒▒  ▒▒▒▒
▓  ▓  ▓  ▓▓        ▓▓  ▓▓▓▓  ▓▓  ▓▓▓▓  ▓▓       ▓▓▓  ▓▓▓▓  ▓▓▓▓▓  ▓▓▓▓
█  ██    ██   ██   ██  ████  ██  ████  ██  ████  ██  ████  █████  ████
█  ███   ██  ████  ███      ███       ███       ████      ██████  ████`
  )

  const client = new Client({
      intents: []
  })

  ready(client);
  interactionCreate(client);
  unhandledRejection(client);
  unhandledException(client);

  client.login(token);

  // ── Graceful Shutdown ───────────────────────────────────────────
  // Adapted from Rawon's shutdown pattern (research report 02, Section 9).
  // Ensures clean disconnect from Discord gateway on process termination.

  let isShuttingDown = false;

  function gracefulShutdown(signal: string): void {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info({ signal }, "Received shutdown signal — cleaning up...");

      try {
          client.destroy();
          logger.info("Discord client destroyed.");
      } catch (err) {
          logger.error({ err }, "Error during client.destroy()");
      }

      process.exit(0);
  }

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // Process-level exception handlers (complement the discord.js client handlers)
  process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "Uncaught exception — shutting down");
      try { client.destroy(); } catch { /* best-effort */ }
      process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
      logger.error({ err: reason }, "Unhandled promise rejection (process-level)");
      // Log but don't exit — let the process continue (matches current behavior)
  });
}

main().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
