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
        if(interaction.options.get('name')){
            name = `*${interaction.options.get('name')!.value?.toString()!}*`
        }
        let gnosis = Number(interaction.options.get('gnosis')!.value)
        let casts = Number(interaction.options.get('casts')?.value || 0)
        let rote = Boolean(interaction.options.get('rote')?.value || false)
        let tool = Boolean(interaction.options.get('tool')?.value || false)
        let sleepers = Boolean(interaction.options.get('sleepers')?.value || false)
        let mitigation = Number(interaction.options.get('mitigation')?.value || 0)
        let backlash = Number(interaction.options.get('backlash')?.value || 0)

        let gnosisMod = Math.ceil(gnosis / 2)
        let castsMod = casts
        let roteMod = rote ? -1 : 0
        let toolMod = tool ? -1 : 0
        let sleepersMod = sleepers ? +2 : 0
        let mitigationMod = -mitigation

        let totalMod = Math.max(0, gnosisMod + castsMod + roteMod + toolMod + sleepersMod + mitigationMod)
        
        let instantRoll = new InstantRoll({dicePool: totalMod})
        let rollDescription = instantRoll.toString()
        let successes = instantRoll.numberOfSuccesses()
        let finalResult = successes - backlash

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
                { name: 'Sleeper witnesses', value: `${sleepers} [${sleepersMod}]`, inline: true },           
                { name: 'Mitigation', value: `${mitigation} [${mitigationMod}]`, inline: true },            
                { name: 'Roll', value: rollDescription, inline: false },
                { name: 'Result', value: `${successes}-${backlash}(backlash)`, inline: false },
            )

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })

        await interaction.followUp({
            embeds: [embed],
        })
        new FeedbackController(client, interaction).getFeedback()
    }
};
