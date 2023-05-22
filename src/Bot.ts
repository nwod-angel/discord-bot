import { Client, ClientOptions } from "discord.js";
// import discord = require("discord.js")
import ready from "./listeners/ready.js";
import interactionCreate from "./listeners/interactionCreate.js";
import unhandledRejection from "./listeners/unhandledRejection.js";
import * as dotenv from 'dotenv'
dotenv.config(); //initialize dotenv

const token = process.env['DISCORD_TOKEN']; // add your token here

console.log("Bot is starting...");
const splash = [
    '                             ______  ____  ______',
    '    ____ _      ______  ____/ / __ )/ __ \/_  __/',
    '   / __ \ | /| / / __ \/ __  / __  / / / / / /   ',
    '  / / / / |/ |/ / /_/ / /_/ / /_/ / /_/ / / /    ',
    ' /_/ /_/|__/|__/\____/\__,_/_____/\____/ /_/     ',
    '                                                 '
]
splash.forEach(line => {
    console.log(line)
});

const client = new Client({
    intents: []
});

ready(client);
interactionCreate(client);
unhandledRejection(client);

client.login(token);

// console.log(client);