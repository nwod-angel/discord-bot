import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import { logger } from "../logger.js"
import RuleProvider from "../data/RuleProvider"
import { NwodSymbols } from "@nwod-angel/nwod-core"
import AsciiTable from 'ascii-table'
import { RuleEmbed } from "../embedBuilders/RuleEmbedBuilder.js"

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
        logger.info({
            user_id: interaction.user.id,
            guild_id: interaction.guildId,
            endpoint: '/rule',
            interaction_id: interaction.id,
            options: {
                name: interaction.options.get('name')?.value,
                search: interaction.options.get('search')?.value,
            },
        }, '/rule command invoked');

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
            embed = new RuleEmbed(rule)
                .withParagraphs()
                .withSources()
                .build()
                .setFooter({ text: interaction.id })
        } else {
            embed = RuleEmbed.buildMultipleRules(rules, { name, search })
                .setFooter({ text: interaction.id })
        }

        logger.debug({
            user_id: interaction.user.id,
            guild_id: interaction.guildId,
            endpoint: '/rule',
            interaction_id: interaction.id,
            embed_title: embed.data.title,
        }, '/rule embed built');
        await interaction.followUp({
            ephemeral: true,
            embeds: [embed],
        });
        // new FeedbackController(client, interaction).getFeedback()
    }
};
