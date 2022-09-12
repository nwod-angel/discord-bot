import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import spells from "../data/spells.js";
import { Command } from "../Command.js";
import DiscordChannelLogger from "../DiscordChannelLogger.js";
import Source from "../models/Source.js";

export const SpellCommand: Command = {
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

        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, options: interaction.options})

        let name = interaction.options.get('name')!.value
        let spell = spells.filter(s => s.name === name)[0]
        if(!spell) {
            await interaction.followUp({
                ephemeral: true,
                content: `Spell ${name} not found.`
            })

        }

        let embed = new EmbedBuilder()
        .setTitle(`${spell.name} (${spell.primaryArcana} ${'•'.repeat(parseInt(spell.requirements.filter(r => r.name.toLowerCase() === spell.primaryArcana.toLowerCase())[0].dots!))})`)
        .addFields(
            { name: 'Requirements', value: spell.requirements.map(r => `${r.name} ${'•'.repeat(parseInt(r.dots!))}`).join('\n'), inline: false },
            { name: 'Practice', value: spell.practice, inline: true },
            { name: 'Action', value: spell.action, inline: true },
            { name: 'Duration', value: spell.duration, inline: true },
            { name: 'Practice', value: spell.aspect, inline: true },
            { name: 'Cost', value: spell.cost, inline: true },
            { name: 'Effect', value: spell.description, inline: false },
            { name: 'Sources', value: spell.sources.map(source => new Source(source.sourceBook, parseInt(source.sourcePage)).toString()).join('/n'), inline: false }
        )
	    .setFooter({ 
            text: interaction.id, 
            // iconURL: 'https://i.imgur.com/AfFp7pu.png'
        });
        
        await interaction.followUp({
            ephemeral: true,
            embeds: [embed]
        });
        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})

    }
};
