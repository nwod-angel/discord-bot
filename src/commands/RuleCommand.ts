import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import RuleProvider from "../data/RuleProvider"
import { NwodSymbols } from "@nwod-angel/nwod-core"

export const RuleCommand: Command = {
    name: "rule",
    description: "Lookup a rule",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the rule",
            "type": 3, // String
            "autocomplete" : true
        },
        {
            "name": "description",
            "description": "Search in the description of the rule",
            "type": 3, // String
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        await DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, options: interaction.options})

        const symbols = new NwodSymbols()

        let name: string | undefined = undefined
        if(interaction.options.get('name')){
            name = interaction.options.get('name')!.value?.toString()
        }

        let description: string | undefined = undefined
        if(interaction.options.get('description')){
            description = interaction.options.get('description')!.value?.toString()
        }

        let rules = RuleProvider.getRules(name, description)
        if(rules.filter(rule => rule.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            rules = rules.filter(rule => rule.name.toLowerCase() === name!.toLowerCase())
        }

        let embed = new EmbedBuilder()
            .setFooter({ 
                text: interaction.id, 
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if(rules.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No rules found.`
            })
        } else if(rules.length === 1){
            let rule = rules[0]
            embed.setTitle(rule.name)

            rule.paragraphs.forEach(paragraph => {
                embed.addFields({ name: '\u200b', value: paragraph.text, inline: false })
            })

            // let descriptionChunks = rule.description.match(/.{1,1000}/g) || []
            // descriptionChunks.forEach((chunk: string, index: number) => {
            //     embed.addFields({ name: `Effect ${index > 0 ? ' (continued)' : ''}`, value: chunk, inline: false })
            // })

            embed.addFields({ name: 'Sources', value: rule.sourcesString(), inline: false })
        } else {
            let rulesToDisplay = rules.slice(0,25)
            let ruleTitles = rulesToDisplay.map(s => s.name).join('\n')
            let parameters = ''

            embed
            .setTitle(`Showing ${rulesToDisplay.length} of ${rules.length}`)
            .addFields(
                { name: `Showing ${rulesToDisplay.length} of ${rules.length}`, value: ruleTitles, inline: false },
            )

        }

        await DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})
        await interaction.followUp({
            ephemeral: true,
            embeds: [embed],
            // components: [feedbackRow]
        });
    }
};
