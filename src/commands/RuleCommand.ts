import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import RuleProvider from "../data/RuleProvider"
import { NwodSymbols } from "@nwod-angel/nwod-core"
import AsciiTable from 'ascii-table'
import FeedbackController from "./FeedbackController.js"

export const RuleCommand: Command = {
    name: "rule",
    description: "Lookup a rule",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the rule",
            "type": 3, // String
            "autocomplete": true
        },
        {
            "name": "search",
            "description": "Search rules for an exact keyword or phrase",
            "type": 3, // String
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, options: interaction.options })

        let name: string | undefined = undefined
        if (interaction.options.get('name')) {
            name = interaction.options.get('name')!.value?.toString()
        }

        let search: string | undefined = undefined
        if (interaction.options.get('search')) {
            search = interaction.options.get('search')!.value?.toString()
        }

        let rules = RuleProvider.getRules(name, search)
        // If the name search matches perfectly to one, that's it
        if (name && rules.filter(rule => rule.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            rules = rules.filter(rule => rule.name.toLowerCase() === name!.toLowerCase())
        }

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if (rules.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No rules found.`
            })
        } else if (rules.length === 1) {
            let rule = rules[0]
            embed.setTitle(rule.name)

            rule.paragraphs.forEach(paragraph => {
                if (paragraph.example) {
                    embed.addFields({ name: 'Example', value: `*${paragraph.text.slice(0, 1022)}*`, inline: false })
                } else if (paragraph.prefix) {
                    embed.addFields({ name: paragraph.prefix, value: paragraph.text.slice(0, 1024), inline: false })
                } else if (paragraph.text) {
                    embed.addFields({ name: '\u200b', value: paragraph.text.slice(0, 1024), inline: false })
                }
            })

            embed.addFields({ name: 'Sources', value: rule.sourcesString(), inline: false })
        } else {
            let rulesToDisplay = rules.slice(0, 25)
            let ruleTitles = rulesToDisplay.map(s => s.name).join('\n')
            let searchTerms = [name ? `Name: ${name}` : null, search ? `Search: ${search}` : null].join('\n')

            embed
                .setTitle(`Showing ${rulesToDisplay.length} of ${rules.length}`)
                .addFields(
                    { name: `Search`, value: searchTerms, inline: false },
                )
                .addFields(
                    { name: `Showing ${rulesToDisplay.length} of ${rules.length}`, value: ruleTitles, inline: false },
                )
        }

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })
        await interaction.followUp({
            ephemeral: true,
            embeds: [embed],
        });
        // new FeedbackController(client, interaction).getFeedback()
    }
};
