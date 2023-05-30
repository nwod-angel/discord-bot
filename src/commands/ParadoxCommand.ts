import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import MeritProvider from "../data/MeritProvider.js"
import { MeritEmbedBuilder } from "../embedBuilders/MeritEmbedBuilder.js"
import FeedbackController from "./FeedbackController.js"
import { InstantRoll } from "@nwod-angel/nwod-roller"

export const ParadoxCommand: Command = {
    name: "paradox",
    description: "roll for paradox",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "gnosis",
            required: true,
            description: "The gnosis of the caster",
            type: 4, // Integer
            minValue: 1,
            maxValue: 10
        },
        {
            name: "wisdom",
            description: "The wisdom of the caster",
            type: 4, // Integer
            minValue: 1,
            maxValue: 10
        },
        {
            name: "arcanum-dots",
            description: "The arcanum dots of the spell",
            type: 4, // Integer
            minValue: 1,
            maxValue: 10
        },
        {
            name: "path",
            description: "The caster's path",
            type: 3, // String
            choices: [
                { name: 'Acanthus', value: 'Acanthus' },
                { name: 'Mastigos', value: 'Mastigos' },
                { name: 'Moros', value: 'Moros' },
                { name: 'Obrimos', value: 'Obrimos' },
                { name: 'Thyrsus', value: 'Thyrsus' }
            ]
        },
        {
            name: "name",
            description: "The name of the caster rolling [optional]",
            type: 3 // String
        },
        {
            name: "casts",
            description: "The number of vulgar spells previously cast [default: 0]",
            type: 4, // Integer
            minValue: 0,
        },
        {
            name: "rote",
            description: "The mage is casting a rote",
            type: 5, // Boolean
        },
        {
            name: "tool",
            description: "The mage uses a magical tool during casting",
            type: 5, // Boolean
        },
        {
            name: "sleepers",
            description: "One or more Sleepers witnesses the magic",
            type: 5, // Boolean
        },
        {
            name: "mitigation",
            description: "One Mana is spent per die the player wants to subtract from the Paradox dice pool.",
            type: 4, // Integer
            minValue: 0,
        },
        {
            name: "backlash",
            description: "A caster can convert Paradox successes to bashing damage on a one-for-one basis.",
            type: 4, // Integer
            minValue: 0,
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, options: interaction.options })

        let name = interaction.member?.user.username
        if (interaction.options.get('name')) {
            name = `*${interaction.options.get('name')!.value?.toString()!}*`
        }
        let gnosis = Number(interaction.options.get('gnosis')!.value)
        let casts = Number(interaction.options.get('casts')?.value || 0)
        let rote = Boolean(interaction.options.get('rote')?.value || false)
        let tool = Boolean(interaction.options.get('tool')?.value || false)
        let sleepers = Boolean(interaction.options.get('sleepers')?.value || false)
        let mitigation = Number(interaction.options.get('mitigation')?.value || 0)
        let backlash = Number(interaction.options.get('backlash')?.value || 0)

        let wisdom = Number(interaction.options.get('wisdom')?.value) || await getWisdom(client, interaction) || 0
        let path = Number(interaction.options.get('path')?.value)
        let arcanumDots = Number(interaction.options.get('arcanum-dots')?.value)

        let gnosisMod = Math.ceil(gnosis / 2)
        let castsMod = casts
        let roteMod = rote ? -1 : 0
        let toolMod = tool ? -1 : 0
        let sleepersMod = sleepers ? +2 : 0
        let mitigationMod = -mitigation

        let totalMod = Math.max(0, gnosisMod + castsMod + roteMod + toolMod + sleepersMod + mitigationMod)

        let instantRoll = new InstantRoll({ dicePool: totalMod })
        let rollDescription = instantRoll.toString()
        let successes = instantRoll.numberOfSuccesses()
        let finalResult = Math.max(0, successes - backlash)
        const backlashTaken = Math.min(finalResult, backlash)

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        embed
            .setTitle(`${name} rolls ${totalMod} for Paradox!`)
            .addFields(
                { name: 'Gnosis', value: `${gnosis} [+${gnosisMod}]`, inline: true },
                { name: 'Previous casts', value: `${casts} [+${castsMod}]`, inline: true },
                { name: 'Rote', value: `${rote} [${roteMod}]`, inline: true },
                { name: 'Magical Tool', value: `${tool} [${toolMod}]`, inline: true },
                { name: 'Sleeper witnesses', value: `${sleepers} [+${sleepersMod}]`, inline: true },
                { name: 'Mitigation', value: `${mitigation} [${mitigationMod}]`, inline: true },
                { name: 'Roll', value: rollDescription, inline: false },
                { name: 'Result', value: `${successes}-${backlash}(backlash) = **${finalResult}**`, inline: false },
            )
        if (backlashTaken > 0) {
            embed.addFields({ name: 'Backlash', value: `${name} takes ${backlashTaken} resistant bashing damage`, inline: false })
        }
        if (finalResult >= 5) {
            embed.addFields({ name: 'Manifestation', value: `${name} causes a manifestation.`, inline: false })
        } else {
            switch (finalResult) {
                case 0:
                    embed.addFields({ name: 'No paradox!', value: `${name} gets away with it this time.`, inline: false })
                    break
                case 1:
                    embed.addFields({ name: 'Havoc', value: `${name} causes Havoc.`, inline: false })
                    if (!wisdom) {
                        wisdom = await getWisdom(client, interaction) || 0
                        if(wisdom != 0) {
                            let wisdomRoll = new InstantRoll({ dicePool: wisdom })

                        }
                    }
                    break
                case 2:
                    embed.addFields({ name: 'Bedlam', value: `${name} causes Bedlam.`, inline: false })
                    break
                case 3:
                    embed.addFields({ name: 'Anomaly', value: `${name} causes an Anomaly.`, inline: false })
                    break
                case 4:
                    embed.addFields({ name: 'Branding', value: `${name} causes a Branding.`, inline: false })
                    break
            }
        }

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })

        await interaction.followUp({
            embeds: [embed],
        })
        await interaction.followUp({
            embeds: [embed],
        })
        new FeedbackController(client, interaction).getFeedback()
    }
};

async function getWisdom(client: Client, interaction: CommandInteraction) {

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            Array.from({ length: 10 }, (_, index) => index + 1).map(opt => new ButtonBuilder()
                .setCustomId(opt.toString())
                .setStyle(ButtonStyle.Secondary)
                .setLabel(opt.toString()))
        )

    const responseInteraction = await interaction.followUp({
        content: "What is your current Wisdom?",
        components: [actionRow],
        ephemeral: true
    })

    try {
        const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 })

        const wisdom = Number(response.customId)
        return wisdom
    } catch (e) {
        // No response
        await interaction.editReply({ 
            content: "What is your current Wisdom? Cancelling.  No response after 30 seconds",
            components: []
        })
        return null
    }
}
