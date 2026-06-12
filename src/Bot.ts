import { Client, ClientOptions } from "discord.js";
import "./typescript/BitInt"

// OTel instrumentation MUST be imported before any other module.
// This initialises the tracing SDK and pino log bridge.
import "./instrumentation.js";

import { logger } from "./logger.js";

process.on('unhandledRejection', error => {
	logger.error({ err: error }, 'Unhandled promise rejection');
});

logger.info("Bot is starting...");
// import discord = require("discord.js")
import ready from "./listeners/ready.js";
import interactionCreate from "./listeners/interactionCreate.js";
import unhandledRejection from "./listeners/unhandledRejection.js";
import * as dotenv from 'dotenv'
import unhandledException from "./listeners/unhandledException.js";

dotenv.config(); //initialize dotenv

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

// logger.debug(client);