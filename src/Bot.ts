import { Client, ClientOptions } from "discord.js";
import "reflect-metadata"
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