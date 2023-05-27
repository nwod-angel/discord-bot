import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import MeritProvider from "../data/MeritProvider.js"
import { NwodSymbols } from "@nwod-angel/nwod-core"

export const MeritCommand: Command = {
    name: "merit",
    description: "Lookup a merit",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the merit",
            "type": 3, // String
            "autocomplete": true
        },
        {
            "name": "description",
            "description": "Search in the description of the merit",
            "type": 3, // String
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, options: interaction.options })

        const symbols = new NwodSymbols()

        let name: string | undefined = undefined
        if (interaction.options.get('name')) {
            name = interaction.options.get('name')!.value?.toString()
        }

        let description: string | undefined = undefined
        if (interaction.options.get('description')) {
            description = interaction.options.get('description')!.value?.toString()
        }

        let merits = MeritProvider.getMerits(name, description)
        if (merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            merits = merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase())
        }

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if (merits.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No merits found.`
            })
        } else if (merits.length === 1) {
            let merit = merits[0]
            embed.setTitle(merit.titleString())

            if (merit.hasRequirements()) {
                embed.addFields({ name: 'Requirements', value: merit.requirementsString(), inline: false })
            }

            let descriptionChunks = merit.description.match(/.{1,1000}/g) || []
            descriptionChunks.forEach((chunk: string, index: number) => {
                embed.addFields({ name: `Effect ${index > 0 ? ' (continued)' : ''}`, value: chunk, inline: false })
            })
            try {
                merit.levels.forEach(level => {
                    let levelDescriptionChunks = level.description.match(/.{1,1000}/g) || []
                    levelDescriptionChunks.forEach((descriptionChunk: string, index: number) => {
                        embed.addFields({ name: `${level.name || merit.name} ${symbols.MeritDot.repeat(level.level)} ${index > 0 ? ' (continued)' : ''}`, value: descriptionChunk, inline: false })
                    })
                })
            } catch (error) {
                console.error('An error occurred while adding fields to the embed:', error)
                console.log("Merit:")
                console.log(merit)
            }

            embed.addFields({ name: 'Sources', value: merit.sourcesString(), inline: false })
        } else {
            let meritsToDisplay = merits.slice(0, 25)
            let meritTitles = meritsToDisplay.map(s => s.titleString()).join('\n')
            let parameters = ''

            embed
                .setTitle(`Showing ${meritsToDisplay.length} of ${merits.length}`)
                .addFields(
                    { name: `Showing ${meritsToDisplay.length} of ${merits.length}`, value: meritTitles, inline: false },
                )

        }

        // Get feedback
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('notGood')
                    .setLabel('Not good')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("😦")
            );

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })
        const responseInteraction = await interaction.followUp({
            embeds: [embed],
            components: [actionRow]
        });

        try {
            const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 10000 })
            if (response.customId === 'notGood') {
                console.log(`${interaction.user.username} thinks ${interaction.id} is not good.`)
            }
        } catch (e) {
            // No response
            await interaction.editReply({ embeds: [embed] });
        }
        // await interaction.reply({ content: 'Was this helpful?', ephemeral: true, components: [feedbackRow] });

    }
};
