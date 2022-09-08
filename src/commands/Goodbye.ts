import { Interaction, Client, ApplicationCommandType, ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Command } from "../Command";
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import * as dotenv from 'dotenv'
dotenv.config(); //initialize dotenv

const discordToken = process.env['DISCORD_TOKEN']
const clientId = process.env['DISCORD_CLIENT_ID']

export const Goodbye: Command = {
    name: "goodbye",
    description: "Removes the slash commands from the server",
    type: ApplicationCommandType.ChatInput,
    run: async (client: Client, interaction: CommandInteraction) => {
        
        const rest = new REST({ version: '9' }).setToken(discordToken!);

        rest.put(Routes.applicationGuildCommands(clientId!, interaction.guildId!), { body: [] })
            .catch(console.error);

    }
};
