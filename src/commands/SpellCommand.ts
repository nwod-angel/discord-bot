import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";
import DiscordChannelLogger from "../DiscordChannelLogger.js";
import SpellProvider from "../data/SpellProvider.js";

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

        let name = interaction.options.get('name')!.value?.toString()
        if(!name) return
        let spell = SpellProvider.getSpell(name)
        if(!spell) {
            await interaction.followUp({
                ephemeral: true,
                content: `Spell ${name} not found.`
            })

        }

        let embed = new EmbedBuilder()
        .setTitle(spell.titleString())
        .addFields(
            { name: 'Requirements', value: spell.requirementsString(), inline: false },
            { name: 'Practice', value: spell.practice.toString(), inline: true },
            { name: 'Action', value: spell.action, inline: true },
            { name: 'Duration', value: spell.duration, inline: true },
            { name: 'Practice', value: spell.aspect, inline: true },
            { name: 'Cost', value: spell.cost, inline: true },
            { name: 'Effect', value: spell.description, inline: false },
            { name: 'Sources', value: spell.sourcesString(), inline: false }
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
