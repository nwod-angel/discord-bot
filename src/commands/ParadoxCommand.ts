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
            name: "in-shadow",
            description: "When mages cast vulgar spells in Shadow two dice are subtracted.",
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
        let inShadow = Boolean(interaction.options.get('in-shadow')?.value || false)
        let sleepers = Boolean(interaction.options.get('sleepers')?.value || false)
        let mitigation = Number(interaction.options.get('mitigation')?.value || 0)
        let backlash = Number(interaction.options.get('backlash')?.value || 0)

        let wisdom = Number(interaction.options.get('wisdom')?.value)

        let path = ''
        if (interaction.options.get('path')) {
            path = `${interaction.options.get('path')!.value?.toString()!}`
        } else {
            // await getPath(client, interaction)
            // .then(pathResponse => {
            //     path = pathResponse || ""
            // })
        }

        let arcanumDots = Number(interaction.options.get('arcanum-dots')?.value)

        const gnosisMod = Math.ceil(gnosis / 2)
        const castsMod = casts
        const roteMod = rote ? -1 : 0
        const toolMod = tool ? -1 : 0
        const shadowMod = inShadow ? -1 : 0
        const sleepersMod = sleepers ? +2 : 0
        const mitigationMod = -mitigation

        const totalMod = Math.max(0, gnosisMod + castsMod + roteMod + toolMod + shadowMod + sleepersMod + mitigationMod)

        const instantRoll = new InstantRoll({ dicePool: totalMod })
        const rollDescription = instantRoll.toString()
        const successes = instantRoll.numberOfSuccesses()
        const finalResult = Math.max(0, successes - backlash)
        const backlashTaken = Math.min(successes, backlash)
        const backlashString = backlashTaken > 0 ? ` - ${backlashTaken}[backlash taken]` : ''
        const result = finalResult >= 5 ? 'Manifestation' :
            finalResult == 4 ? 'Branding' :
                finalResult == 3 ? 'Anomaly' :
                    finalResult == 2 ? 'Bedlam' :
                        finalResult == 1 ? 'Havoc' :
                            'No Paradox'

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        embed
            .setTitle(`${name} rolls ${totalMod} for Paradox!`)
            .addFields(
                { name: 'Gnosis', value: `${gnosis} [+${gnosisMod}]`, inline: true }
            )
        if (castsMod > 0) { embed.addFields({ name: 'Previous casts', value: `${casts} [+${castsMod}]`, inline: true }) }
        if (roteMod > 0) { embed.addFields({ name: 'Rote', value: `${rote} [${roteMod}]`, inline: true }) }
        if (toolMod > 0) { embed.addFields({ name: 'Magical Tool', value: `${tool} [${toolMod}]`, inline: true }) }
        if (shadowMod > 0) { embed.addFields({ name: 'In Shadow', value: `${inShadow} [${shadowMod}]`, inline: true }) }
        if (sleepersMod > 0) { embed.addFields({ name: 'Sleeper witnesses', value: `${sleepers} [+${sleepersMod}]`, inline: true }) }
        if (mitigationMod > 0) { embed.addFields({ name: 'Mana Mitigation', value: `${mitigation} [${mitigationMod}]`, inline: true }) }

        embed.addFields({ name: 'Roll', value: `${successes}[${rollDescription}]${backlashString} = **${finalResult} (${result})**`, inline: false })

        if (mitigation > 0) {
            embed.addFields({ name: '✨ Mana Mitigation', value: `${name} uses **${mitigation} mana** to mitigate the paradox`, inline: false })
        }
        if (backlashTaken > 0) {
            embed.addFields({ name: '🤕 Backlash', value: `${name} takes **${backlashTaken} resistant bashing damage**`, inline: false })
        }

        switch (result) {
            case 'No Paradox':
                embed.addFields({ name: '😮‍💨 No paradox!', value: `${name} gets away with it this time.`, inline: false })
                break
            case 'Havoc':
                embed.addFields({ name: '😒 Havoc', value: havocDefinition, inline: false })
                if (!wisdom) {
                    wisdom = await getWisdom(client, interaction) || 0
                    if (wisdom != 0) {
                        let wisdomRoll = new InstantRoll({ dicePool: wisdom })

                        if (wisdomRoll.isCriticalFailure()) {
                            embed.addFields({
                                name: `💀 Wisdom Roll **${wisdomRoll.numberOfSuccesses()}**`,
                                value: wisdomRoll.toString() + '\n' +
                                    'Dramatic Failure: The spell’s desired effect is reversed. A blessing becomes a curse, a magical perception spell blinds the mage to all resonance, or an attack spell helps the target instead.'
                            })
                        } else if (wisdomRoll.isFailure()) {
                            embed.addFields({
                                name: `❌ Wisdom Roll **${wisdomRoll.numberOfSuccesses()}**`,
                                value: wisdomRoll.toString() + '\n' +
                                    'Failure: The spell’s desired effect is reversed. A blessing becomes a curse, a magical perception spell blinds the mage to all resonance, or an attack spell helps the target instead.'
                            })
                        } else if (wisdomRoll.isExceptionalSuccess()) {
                            embed.addFields({
                                name: `⭐ Wisdom Roll **${wisdomRoll.numberOfSuccesses()}**`,
                                value: wisdomRoll.toString() + '\n' +
                                    'Exceptional Success: The spell’s effect is unaltered and the mage gains a +2 dice bonus for any attempts he might make to dispel the Havoc spell.'
                            })
                        } else if (wisdomRoll.isSuccess()) {
                            embed.addFields({
                                name: `✅ Wisdom Roll **${wisdomRoll.numberOfSuccesses()}**`,
                                value: wisdomRoll.toString() + '\n' +
                                    'Success: The spell’s effect is unaltered.'
                            })
                        }
                    }
                }
                break
            case 'Bedlam':
                embed.addFields({ name: '😬 Bedlam', value: `${name} causes Bedlam.`, inline: false })
                break
            case 'Anomaly':
                embed.addFields({ name: '😰 Anomaly', value: `${name} causes an Anomaly.`, inline: false })
                break
            case 'Branding':
                embed.addFields({ name: '😡 Branding', value: `${name} causes a Branding.`, inline: false })
                break
            case 'Manifestation':
                embed.addFields({ name: '😱 Manifestation', value: `${name} causes a manifestation.`, inline: false })
                break
        }

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })

        await interaction.followUp({
            embeds: [embed],
        })
        // new FeedbackController(client, interaction).getFeedback()
    }
};

async function getWisdom(client: Client, interaction: CommandInteraction) {

    let actionRows = new Array<ActionRowBuilder<ButtonBuilder>>()
    const buttonsPerRow = 5
    const maxWisdom = 10
    const wisdomOptions = Array.from({ length: maxWisdom }, (_, index) => index + 1)
    const wisdomOptionRows = splitArray(wisdomOptions, buttonsPerRow)
    wisdomOptionRows.forEach(wisdomOptionRow => {
        actionRows.push(new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                wisdomOptionRow.map(opt => new ButtonBuilder()
                    .setCustomId(opt.toString())
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(opt.toString()))
            ))
    });

    const responseInteraction = await interaction.followUp({
        content: "What is your current Wisdom?",
        components: actionRows,
        ephemeral: true
    })

    try {
        const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 })

        const wisdom = Number(response.customId)
        response.update({ content: `Using Wisdom ${wisdom}`, components: [] })
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

async function getPath(client: Client, interaction: CommandInteraction): Promise<string | undefined> {

    let actionRows = new Array<ActionRowBuilder<ButtonBuilder>>()
    const buttonsPerRow = 5
    const pathOptions = [
        '⌛🎲 Acanthus',
        '🧠🌌 Mastigos',
        '💀🧱 Moros',
        '⚡🪄 Obrimos',
        '🌿👻 Thyrsus',
    ]
    const optionRows = splitArray(pathOptions, buttonsPerRow)
    optionRows.forEach(optionRow => {
        actionRows.push(new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                optionRow.map(opt => new ButtonBuilder()
                    .setCustomId(opt.toString())
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(opt.toString()))
            ))
    });

    return interaction.followUp({
        content: "What is your path?",
        components: actionRows,
        ephemeral: true
    })
        .then(responseInteraction => {
            try {
                return responseInteraction
                    .awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 })
                    .then(response => {
                        const path = response.customId
                        response.update({ content: `Using Path ${path}`, components: [] })
                        return path
                    })
            } catch (e) {
                // No response
                interaction.editReply({
                    content: "What is your path? Cancelling.  No response after 30 seconds",
                    components: []
                }).then(() => {
                    return ""
                })
            }
        }).finally(() => {
            return ""
        })
}

function splitArray<T>(array: Array<T>, n: number) {
    return Array.from({ length: Math.ceil(array.length / n) }, (_, index) =>
        array.slice(index * n, index * n + n)
    );
}


const havocDefinition = "The mage's spell becomes Havoc, affecting a randomly chosen target instead of the intended one. The new target must be of the same type. The mage and objects can also be affected. The new target can resist the spell. The mage's Wisdom is rolled: Dramatic Failure or Failure reverses it, Success keeps the effect unchanged, and Exceptional Success grants a bonus for dispelling. The spell cannot be dismissed and lasts for its Duration. Concentration-based spells become transitory, with the duration determined by a die roll."

// const havocDefinition = "The mage’s spell is no longer under his control and is considered a Havoc spell. It affects a randomly chosen target (or targets, if multiple targets were factored into the casting) instead of the caster’s declared target(s). The caster himself is included in this pool of random victims. The new target must be of the same type — if the mage targeted a living person, then the pool of random targets include only living people. If the mage’s target is an object, then only objects are affected. If the caster is the only viable target present, he is the target of his own spell (unless he was its originally intended target, in which case the spell affects a target of a different kind, such as an object)." + "\n" +
// "The new target — including the mage himself if he is the spell’s new target — can contest or resist the spell if it is normally allowed (see the spell’s description)." + "\n" +
// "In addition, the mage’s Wisdom is rolled." + "\n" +
// "Since the spell is no longer under the caster’s control he cannot dismiss it at will." + "\n" +
// "A Havoc lasts for only as long as the spell’s Duration. Note that spells with a concentration-based Duration become transitory; the Storyteller rolls a single die and the result is the number of turns the spells lasts."