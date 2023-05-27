import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import MeritProvider from "../data/MeritProvider.js"
import { MeritEmbedBuilder } from "../embedBuilders/MeritEmbedBuilder.js"
import FeedbackController from "./FeedbackController.js"

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


        let name: string | undefined = undefined
        if (interaction.options.get('name')) {
            name = interaction.options.get('name')!.value?.toString()
        }

        let description: string | undefined = undefined
        if (interaction.options.get('description')) {
            description = interaction.options.get('description')!.value?.toString()
        }

        let merits = MeritProvider.getMerits(name, description)
        if (name && merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            merits = merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase())
        }

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if (merits.length === 0) { // None
            embed.setTitle( `No merits found.`)
        } else if (merits.length === 1) { // One
            let merit = merits[0]

            MeritEmbedBuilder.buildMeritEmbed(merit, embed)

        } else { // More than one
            let meritsToDisplay = merits.slice(0, 25)
            let meritTitles = meritsToDisplay.map(s => s.titleString()).join('\n')
            let parameters = ''

            embed
                .setTitle(`Showing ${meritsToDisplay.length} of ${merits.length}`)
                .addFields(
                    { name: `Showing ${meritsToDisplay.length} of ${merits.length}`, value: meritTitles, inline: false },
                )
        }

        const feedbackController = new FeedbackController(client, interaction)
        feedbackController.getFeedback()

        // Get feedback
        // const actionRow = new ActionRowBuilder<ButtonBuilder>()
        // .addComponents(
        //     new ButtonBuilder()
        //         .setCustomId('happy')
        //         // .setLabel('Not good')
        //         .setStyle(ButtonStyle.Success)
        //         .setEmoji("🙂")
        // )
        // .addComponents(
        //     new ButtonBuilder()
        //         .setCustomId('unhappy')
        //         // .setLabel('Not good')
        //         .setStyle(ButtonStyle.Danger)
        //         .setEmoji("😦")
        // )

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })
        interaction.followUp({
            embeds: [embed],
            // components: [actionRow]
        });

        // try {
        //     const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 10000 })
        //     switch(response.customId) {
        //         case 'unhappy':
        //             let unhappy = `${interaction.user.username} is unhappy with interaction ${interaction.id}.`
        //             console.log(unhappy)
        //             DiscordChannelLogger.setClient(client).logFeedback(unhappy)
        //             break
        //         case 'happy':  
        //             let happy = `${interaction.user.username} is happy with interaction ${interaction.id}.`
        //             console.log(happy)
        //             DiscordChannelLogger.setClient(client).logFeedback(happy)
        //             break
        //     }
        //     await response.editReply({ components: [] })
        // } catch (e) {
        //     // No response
        //     await interaction.editReply({ components: [] })
        // }
        // await interaction.reply({ content: 'Was this helpful?', ephemeral: true, components: [feedbackRow] });

    }
};
