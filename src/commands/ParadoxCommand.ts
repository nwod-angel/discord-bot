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
            description: "The name of the caster rolling",
            type: 3 // String
        },
        {
            name: "description",
            description: "The description of the paradox roll",
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


        let name = interaction.options.get('name')!.value?.toString() || interaction.member?.user.username
        let description = interaction.options.get('description')!.value?.toString() || undefined
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
        const backlashString = backlashTaken > 0 ? ` - ${backlashTaken} (backlash taken)` : ''
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

        embed.setTitle(`${name} rolls ${totalMod} for Paradox!`)

        if (description) { embed.addFields({ name: 'Description', value: description}) }
        embed.addFields({ name: 'Gnosis', value: `${gnosis} [+${gnosisMod}]`, inline: true })
        if (casts > 0) { embed.addFields({ name: 'Previous casts', value: `${casts} [+${castsMod}]`, inline: true }) }
        if (rote) { embed.addFields({ name: 'Rote', value: `${rote} [${roteMod}]`, inline: true }) }
        if (tool) { embed.addFields({ name: 'Magical Tool', value: `${tool} [${toolMod}]`, inline: true }) }
        if (inShadow) { embed.addFields({ name: 'In Shadow', value: `${inShadow} [${shadowMod}]`, inline: true }) }
        if (sleepers) { embed.addFields({ name: 'Sleeper witnesses', value: `${sleepers} [+${sleepersMod}]`, inline: true }) }
        if (mitigation > 0) { embed.addFields({ name: 'Mana Mitigation', value: `${mitigation} [${mitigationMod}]`, inline: true }) }

        if (mitigation > 0) {
            embed.addFields({ name: '✨ Mana Mitigation', value: `${name} uses **${mitigation} mana** to mitigate the paradox`, inline: false })
        }

        embed.addFields({
            name: `🎲 Paradox rolled ${instantRoll.dicePool} dice and got ${successes} successes`,
            value: rollDescription
        })

        if (backlashTaken > 0) {
            embed.addFields({ name: '🤕 Backlash', value: `${name} takes **${backlashTaken} resistant bashing damage**`, inline: false })
        }

        embed.addFields({
            name: `Result`,
            value: `${successes}${backlashString} = **${finalResult} (${result})**`
        })

        switch (result) {
            case 'No Paradox':
                embed.addFields({ name: '😮‍💨 No paradox!', value: `${name} gets away with it this time.`, inline: false })
                break
            case 'Havoc':
                embed.addFields({ name: '😒 Havoc', value: havocSummary, inline: false })
                wisdom = await getWisdom(wisdom, client, interaction) || 0
                if (wisdom != 0) {
                    embed.addFields({ name: 'Wisdom', value: `${wisdom}`, inline: true })
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
                embed.addFields({ name: 'Wisdom', value: `${wisdom || 'unknown'}`, inline: true })
                switch (wisdom) {
                    case 1: duration = 'Two days'; break
                    case 2: duration = '24 hours'; break
                    case 3: duration = '12 hours'; break
                    case 4: duration = '2 hours'; break
                }
                arcanumDots = await getArcanumDots(arcanumDots, client, interaction) || 0
                embed.addFields({ name: 'Arcanum Dots', value: `${arcanumDots || 'unknown'}`, inline: true })
                let derangementSeverity = (arcanumDots) < 3 ? 'mild' : 'severe'
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
                embed.addFields({ name: 'Wisdom', value: `${wisdom || 'unknown'}`, inline: true })
                switch (wisdom) {
                    case 1: duration = 'One month'; break
                    case 2: duration = 'One week'; break
                    case 3: duration = 'Two days'; break
                    case 4: duration = '24 hours'; break
                }
                path = await getPath(path, client, interaction)
                const pathData = paths.filter(p => p.pathId.toLowerCase() == path?.toLowerCase())[0]
                embed.addFields({ name: 'Path', value: pathData.fancyName, inline: true })

                arcanumDots = await getArcanumDots(arcanumDots, client, interaction) || 0
                embed.addFields({ name: 'Arcanum Dots', value: `${arcanumDots || 'unknown'}`, inline: true })

                const radius = arcanumDots * 20
                embed.addFields({
                    name: `${name} causes a **${pathData.realm}** anomaly for **${duration}** in a **${radius} yard radius**.`,
                    value: pathData.anomalyDescription
                })

                break
            case 'Branding':
                embed.addFields({ name: '😡 Branding', value: brandingSummary, inline: false })
                arcanumDots = await getArcanumDots(arcanumDots, client, interaction) || 0
                embed.addFields({ name: 'Arcanum Dots', value: `${arcanumDots || 'unknown'}`, inline: true })
                if (arcanumDots) {
                    const brandingLevel = brandingLevels.filter(bl => bl.value == arcanumDots)[0]
                    embed.addFields({ name: `${name} is branded with a **${brandingLevel.name}**`, value: brandingLevel.description, inline: false })
                }
                break
            case 'Manifestation':
                embed.addFields({ name: '👿 Manifestation', value: manifestationSummary, inline: false })
                arcanumDots = await getArcanumDots(arcanumDots, client, interaction) || 0
                embed.addFields({ name: 'Arcanum Dots', value: `${arcanumDots || 'unknown'}`, inline: true })
                if (arcanumDots) {
                    const manifestationLevel = manifestationLevels.filter(ml => ml.value == arcanumDots)[0]
                    embed.addFields({ name: `${name} invokes a ${'⬤'.repeat(arcanumDots)} manifestation`, value: manifestationLevel.description, inline: false })
                }
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

const brandingLevels = [
    {
        value: 1,
        name: 'Uncanny Nimbus',
        description: 'The mage’s nimbus is disfigured by his Vice. Anyone with supernatural perception can see it. An Envious or Prideful mage’s nimbus might be weaker when affecting others and seem stronger when affecting the mage himself. A Greedy mage’s nimbus might not affect others at all, although its presence is still obvious. A Wrathful mage’s nimbus might seem threatening to others, although it cannot harm them directly.'
    },
    {
        value: 2,
        name: 'Witch’s Mark',
        description: 'The mage bears a weird but non-prominent blemish that is visible to Sleepers. He might have luminous motes in his eyes (Lust or Greed), his body radiates heat (Wrath) or cold (Envy), or there is a grayish pallor to his skin (Sloth). In addition, he has an uncanny nimbus, as above.'
    },
    {
        value: 3,
        name: 'Disfigurement',
        description: 'The mage bears a prominent blemish that is visible to Sleepers, such as a metallic sheen to his skin (Pride), the pupils of an animal (Wrath or Gluttony), a bizarre tenor to his voice (Lust, Envy, Greed). In addition, he has an uncanny nimbus, as above. He suffers a –1 dice penalty to Social rolls with Sleepers (except Intimidation Skill uses).'
    },
    {
        value: 4,
        name: 'Bestial Feature',
        description: 'The mage gains an animal trait, such as claws (Wrath; +1 dice, lethal damage), fangs (Envy or Gluttony; +1 dice, lethal damage), horns (Pride; +2 dice, lethal damage), a tail (Greed or Lust; it has half the mage’s Strength, rounding up), fur or scales (Sloth or Pride; one armor point). None of these features can be concealed easily. He suffers a –3 dice penalty to all Social rolls (except Intimidation Skill uses).'
    },
    {
        value: 5,
        name: 'Inhuman Feature',
        description: 'The mage gains an inhuman trait, such as a bestial feature that is clearly demonic or supernatural. Maybe his tail is forked or his eyes glow. Or he might be surrounded by a cloud of flies (Gluttony or Greed), a miasma that causes plants to wither (Sloth or Envy), a herd of crawling vermin (Pride or Lust), or a pall of smoke (Wrath). He suffers a –5 dice penalty to all Social rolls (except Intimidation Skill uses).'
    }
]

const manifestationLevels = [
    {
        value: 1,
        title: '1 Arcanum Dot',
        description: 'The manifestation is a gremlin or imp, a minor spirit with a dark sense of humor that troubles the mage for a short time. It is of Rank 1 (with 5-8 Attribute dots) or 2 (9-14 Attribute dots). This entity exists in Twilight and cannot cause direct harm, but it can cause any number of minor problems. It has some influence over the material world, like a poltergeist. It can open and close doors, tip things over, and send small objects flying across a room.'
    },
    {
        value: 2,
        title: '2 Arcanum Dots',
        description: 'A more powerful and menacing entity (Rank 3, with 15-25 Attribute dots) manifests in the material realm. It is malicious and rarely humorous. It has a keen sense of timing, causes various hassles and has powers like those of gremlins, above.'
    },
    {
        value: 3,
        title: '3 Arcanum Dots',
        description: 'Entities of this intensity are more complex and capable (Rank 3 or 4, with 26-35 Attribute dots), driven less by pure instinct and emotion and more by thought and planning. They are also powerful enough to manifest a physical form and interact with the material world. They are cunning enough to pretend to have the mage’s interests at heart, while leading him astray. The promises of such creatures are not to be trusted.'
    },
    {
        value: 4,
        title: '4 Arcanum Dots',
        description: 'The entity’s power is equal to that of the mage in every respect. Such entities range from murderous monsters that stalk and kill the mage’s loved ones (or enemies, pinning the blame on the mage) to seductive manifestations of the mage’s darkest desires. Some entities this powerful, called doppelgangers, appear exactly like the mage who spawned them. Doppelgangers never appear in the same place as their double. They are always elsewhere, causing mischief. The only means of banishing a doppelganger is for the mage to confront it directly (whereupon is vanishes). Doppelgangers must be restrained in order to do this. They can sense the approach of their double and flee if at all possible.'
    },
    {
        value: 5,
        title: '5 Arcanum Dots',
        description: 'The mage draws the attention of a truly powerful entity (Rank 4 or 5, with 36-45 Attribute dots). The entity may try to destroy the mage or possess his body. Alternately, it may attempt to seduce the mage with promises of power, knowledge and the fulfillment of his desires. The entity remains in the world until either banished by the mage who summoned it or until the mage’s death. In the past, the orders have sanctioned the execution of mages responsible for calling such entities into reality.'
    }
]