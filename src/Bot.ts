import { Client, ClientOptions } from "discord.js";
// import discord = require("discord.js")
import ready from "./listeners/ready.js";
import interactionCreate from "./listeners/interactionCreate.js";
import * as dotenv from 'dotenv'
dotenv.config(); //initialize dotenv

const token = process.env['DISCORD_TOKEN']; // add your token here

console.log("Bot is starting...");

const client = new Client({
    intents: []
});

ready(client);
interactionCreate(client);

client.login(token);

// console.log(client);