import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import FeedbackController from "./FeedbackController.js"
import { InstantRoll } from "@nwod-angel/nwod-roller"
import paths from "../data/paths.js"

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
            choices: paths.map(p => { return { name: p.fancyName, value: p.pathId } })
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

        let path = interaction.options.get('path')?.value?.toString()
        let arcanumDots = Number(interaction.options.get('arcanum-dots')?.value)

        const gnosisMod = Math.ceil(gnosis / 2)
        const castsMod = casts
        const roteMod = rote ? -1 : 0
        const toolMod = tool ? -1 : 0
        const shadowMod = inShadow ? -2 : 0
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
        let duration = 'One scene'

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
        if (casts > 0) { embed.addFields({ name: 'Previous casts', value: `${casts} [+${castsMod}]`, inline: true }) }
        if (rote) { embed.addFields({ name: 'Rote', value: `${rote} [${roteMod}]`, inline: true }) }
        if (tool) { embed.addFields({ name: 'Magical Tool', value: `${tool} [${toolMod}]`, inline: true }) }
        if (inShadow) { embed.addFields({ name: 'In Shadow', value: `${inShadow} [${shadowMod}]`, inline: true }) }
        if (sleepers) { embed.addFields({ name: 'Sleeper witnesses', value: `${sleepers} [+${sleepersMod}]`, inline: true }) }
        if (mitigation > 0) { embed.addFields({ name: 'Mana Mitigation', value: `${mitigation} [${mitigationMod}]`, inline: true }) }

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
                embed.addFields({ name: '😒 Havoc', value: havocSummary, inline: false })
                wisdom = await getWisdom(wisdom, client, interaction) || 0
                if (wisdom != 0) {
                    let wisdomRoll = new InstantRoll({ dicePool: wisdom })

                    if (wisdomRoll.isCriticalFailure()) {
                        embed.addFields({
                            name: `💀 ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Dramatic Failure:** The spell’s desired effect is reversed. A blessing becomes a curse, a magical perception spell blinds the mage to all resonance, or an attack spell helps the target instead.'
                        })
                    } else if (wisdomRoll.isFailure()) {
                        embed.addFields({
                            name: `❌ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Failure:** The spell’s desired effect is reversed. A blessing becomes a curse, a magical perception spell blinds the mage to all resonance, or an attack spell helps the target instead.'
                        })
                    } else if (wisdomRoll.isExceptionalSuccess()) {
                        embed.addFields({
                            name: `⭐ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Exceptional Success:** The spell’s effect is unaltered and the mage gains a +2 dice bonus for any attempts he might make to dispel the Havoc spell.'
                        })
                    } else if (wisdomRoll.isSuccess()) {
                        embed.addFields({
                            name: `✅ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Success:** The spell’s effect is unaltered.'
                        })
                    }
                }
                break
            case 'Bedlam':
                embed.addFields({ name: '😬 Bedlam', value: bedlamSummary, inline: false })
                wisdom = await getWisdom(wisdom, client, interaction) || 0
                switch (wisdom) {
                    case 1: duration = 'Two days'; break
                    case 2: duration = '24 hours'; break
                    case 3: duration = '12 hours'; break
                    case 4: duration = '2 hours'; break
                }
                let derangementSeverity = (await getArcanumDots(arcanumDots, client, interaction) || 0) < 3 ? 'mild' : 'severe'
                let derangements = [
                    { name: 'Avoidance', category: 'mild' },
                    { name: 'Fugue', category: 'severe' },
                    { name: 'Depression', category: 'mild' },
                    { name: 'Melancholia', category: 'severe' },
                    { name: 'Fixation', category: 'mild' },
                    { name: 'Obsessive Compulsion', category: 'severe' },
                    { name: 'Inferiority Complex', category: 'mild' },
                    { name: 'Anxiety', category: 'severe' },
                    { name: 'Irrationality', category: 'mild' },
                    { name: 'Mulitple Personality', category: 'severe' },
                    { name: 'Narcissism', category: 'mild' },
                    { name: 'Megalomania', category: 'severe' },
                    { name: 'Phobia', category: 'mild' },
                    { name: 'Hysteria', category: 'severe' },
                    { name: 'Suspicion', category: 'mild' },
                    { name: 'Paranoia', category: 'severe' },
                    { name: 'Vocalization', category: 'mild' },
                    { name: 'Schizophrenia', category: 'severe' },
                ]
                embed.addFields({
                    name: `🫠 ${name} suffers a **${derangementSeverity}** derangement for **${duration}**`,
                    value: derangements.filter(d => d.category == derangementSeverity).map(d => d.name).join(', '), inline: false
                })
                if (wisdom != 0) {
                    let wisdomRoll = new InstantRoll({ dicePool: wisdom })

                    if (wisdomRoll.isCriticalFailure()) {
                        embed.addFields({
                            name: `💀 ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Dramatic Failure:** The mage’s madness is contagious. One other mage per dot of the invoker’s Presence also suffers from the Bedlam derangement for as long as the Paradox lasts (based on the invoker’s Wisdom, not the victim’s). Randomly choose targets from within the spell’s range, including any sympathetic targets. The target may contest the Bedlam with a reflexive Resolve + Composure roll. If successful, he is unaffected.'
                        })
                    } else if (wisdomRoll.isFailure()) {
                        embed.addFields({
                            name: `❌ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Failure:** The mage’s madness is contagious. One other mage also suffers from the Bedlam derangement for as long as the Paradox lasts (based on the invoker’s Wisdom, not the victim’s). Randomly choose target from within the spell’s range, including any sympathetic targets. The target may contest the Bedlam with a reflexive Resolve + Composure roll. If successful, he is unaffected.'
                        })
                    } else if (wisdomRoll.isExceptionalSuccess()) {
                        embed.addFields({
                            name: `⭐ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Exceptional Success:** Only the mage is affected by Bedlam.'
                        })
                    } else if (wisdomRoll.isSuccess()) {
                        embed.addFields({
                            name: `✅ ${name} rolled ${wisdomRoll.dicePool} for Wisdom: **${wisdomRoll.numberOfSuccesses()}**`,
                            value: wisdomRoll.toString() + '\n' +
                                '**Success:** Only the mage is affected by Bedlam.'
                        })
                    }
                }
                break
            case 'Anomaly':
                embed.addFields({ name: '😰 Anomaly', value: anomalySummary, inline: false })
                wisdom = await getWisdom(wisdom, client, interaction) || 0
                switch (wisdom) {
                    case 1: duration = 'One month'; break
                    case 2: duration = 'One week'; break
                    case 3: duration = 'Two days'; break
                    case 4: duration = '24 hours'; break
                }
                path = await getPath(path, client, interaction)
                const radius = (await getArcanumDots(arcanumDots, client, interaction) || 0) * 20
                const pathData = paths.filter(p => p.pathId.toLowerCase() == path?.toLowerCase())[0]
                embed.addFields({
                    name: `${name} causes a **${pathData.realm}** anomaly for **${duration}** in a **${radius} yard radius**.`,
                    value: pathData.anomalyDescription
                })

                break
            case 'Branding':
                embed.addFields({ name: '😡 Branding', value: brandingSummary, inline: false })
                break
            case 'Manifestation':
                embed.addFields({ name: '👿 Manifestation', value: manifestationSummary, inline: false })
                break
        }

        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })

        await interaction.followUp({
            embeds: [embed],
        })
        // new FeedbackController(client, interaction).getFeedback()
    }
};

getArcanumDots

async function getArcanumDots(arcanumDots: number, client: Client, interaction: CommandInteraction) {
    if (arcanumDots > 0) {
        return arcanumDots
    } else {
        return getArcanumDotsInteractive(client, interaction)
    }
}
async function getArcanumDotsInteractive(client: Client, interaction: CommandInteraction) {

    let actionRows = new Array<ActionRowBuilder<ButtonBuilder>>()
    const buttonsPerRow = 5
    const maxArcanumDots = 5
    const arcanumdotsOptions = Array.from({ length: maxArcanumDots }, (_, index) => index + 1)
    const arcanumdotsOptionRows = splitArray(arcanumdotsOptions, buttonsPerRow)
    arcanumdotsOptionRows.forEach(arcanumdotsOptionRow => {
        actionRows.push(new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                arcanumdotsOptionRow.map(opt => new ButtonBuilder()
                    .setCustomId(opt.toString())
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(opt.toString()))
            ))
    });

    const responseInteraction = await interaction.followUp({
        content: "What is the highest arcanum dots of the spell?",
        components: actionRows,
        ephemeral: true
    })

    try {
        const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 })

        const arcanumdots = Number(response.customId)
        response.update({ content: `Using ${arcanumdots} arcanum dots`, components: [] })
        return arcanumdots
    } catch (e) {
        // No response
        await interaction.editReply({
            content: "What is the highest arcanum dots of the spell? Cancelling.  No response after 30 seconds",
            components: []
        })
        return null
    }
}

async function getWisdom(wisdom: number, client: Client, interaction: CommandInteraction) {
    if (wisdom > 0) {
        return wisdom
    } else {
        return getWisdomInteractive(client, interaction)
    }
}
async function getWisdomInteractive(client: Client, interaction: CommandInteraction) {

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

async function getPath(path: string | undefined, client: Client, interaction: CommandInteraction) {
    if (path) {
        return path
    } else {
        return getPathInteractive(client, interaction)
    }
}

async function getPathInteractive(client: Client, interaction: CommandInteraction): Promise<string | undefined> {

    let actionRows = new Array<ActionRowBuilder<ButtonBuilder>>()
    const buttonsPerRow = 5
    const optionRows = splitArray(paths, buttonsPerRow)
    optionRows.forEach(optionRow => {
        actionRows.push(new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                optionRow.map(opt => new ButtonBuilder()
                    .setCustomId(opt.pathId)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(opt.fancyName))
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

const havocSummary = "The mage's spell becomes Havoc, affecting a randomly chosen target instead of the intended one. The new target must be of the same type. The mage and objects can also be affected. The new target can resist the spell. The mage's Wisdom is rolled: Dramatic Failure or Failure reverses it, Success keeps the effect unchanged, and Exceptional Success grants a bonus for dispelling. The spell cannot be dismissed and lasts for its Duration. Concentration-based spells become transitory, with the duration determined by a die roll."
const bedlamSummary = "The mage gains a temporary derangement as a result of invoking Paradox, similar to Wisdom degeneration. The specific derangement is chosen by the player and Storyteller. The derangement is active for the duration of the Paradox and disappears once it ends. The player is expected to roleplay the derangement creatively, but the Storyteller can intervene if the character's actions contradict the derangement, imposing a Willpower penalty if necessary."
const anomalySummary = "Reality fractures and allows for the occurrence of impossible events. The extent of the affected area depends on the highest Arcanum used, with a radius of 20 yards per dot. Anomalies are not influenced by the disbelief of regular individuals. Anomalies are unpredictable, with the Storyteller determining their effects and rules. Examples based on the Path realm are given, but Storytellers are encouraged to be inventive and perplex the caster. If multiple Paradox Anomalies from different Path realms occur in the same area during a scene, their effects combine. Furthermore, if the same Path realm causes multiple Anomalies in the same area during the same scene, the effects are intensified."
const brandingSummary = "When a mage misuses magic, their body is affected and bears the mark of their spell. Different levels of Arcanum Dots result in distinct Brands. Examples of Brands include the Uncanny Nimbus, Witch's Mark, Disfigurement, Bestial Feature, and Inhuman Feature. The Storyteller has the freedom to create a Brand that symbolically represents the mage's Vice. For instance, an Envious or Prideful mage's nimbus may appear weaker when affecting others but stronger when affecting the mage. A Greedy mage's nimbus may not affect others directly but is still noticeable, while a Wrathful mage's nimbus may be menacing without causing direct harm."
const manifestationSummary = "An entity from the Abyss enters the Fallen World, it materializes in the vicinity of the mage who summoned it. The manifestation occurs within a certain range, typically not exceeding 10 yards per dot of the caster's Gnosis. The entity's appearance is not necessarily within the mage's line of sight; it could emerge below the mage, in the sewers, or even in a concealed room beyond the nearest wall."