import { Client, ClientOptions } from "discord.js";
import "./typescript/BitInt"

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

console.log("Bot is starting...");
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
    console.log("  USE_API_ROLL is off — API delegation disabled.");
    return;
  }

  const healthUrl = `${API_BASE_URL}/health`;
  console.log(`  USE_API_ROLL is ON — checking API at ${healthUrl} …`);

  try {
    const res = await fetch(healthUrl, { method: "GET", signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      console.log(`  ✅ API reachable (HTTP ${res.status}) — rolls will be delegated.`);
    } else {
      console.log(`  ⚠️  API returned HTTP ${res.status} — will fall back to local rolls.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ API unreachable (${msg}) — will fall back to local rolls.`);
  }
}

checkApiHealth();

console.log(`    
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

// console.log(client);