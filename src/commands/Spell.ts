import { Interaction, Client, ApplicationCommandType, CommandInteraction } from "discord.js";
import { Command } from "../Command.js";

export const Spell: Command = {
    name: "spell",
    description: "Lookup a spell",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the spell",
            "type": 4, // Integer
            "required": true,
            "minValue": 0
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        const content = "Hello there!";

        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};
