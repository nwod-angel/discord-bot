import { Interaction, Client, ApplicationCommandType, CommandInteraction } from "discord.js";
import spells from "../data/spells.js";
import { Command } from "../Command.js";

export const Spell: Command = {
    name: "spell",
    description: "Lookup a spell",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the spell",
            "type": 3, // String
            "autocomplete" : true,
            "required": true
        }
    ], 
    run: async (client: Client, interaction: CommandInteraction) => {

        let name = interaction.options.get('name')!.value
        let spell = spells.filter(s => s.name === name)[0]
        if(!spell) {
            await interaction.followUp({
                ephemeral: true,
                content: `Spell ${name} not found.`
            })

        }
        await interaction.followUp({
            ephemeral: true,
            content: spell.description
        })

    }
};
