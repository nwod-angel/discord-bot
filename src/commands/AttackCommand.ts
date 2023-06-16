import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "../Command.js";
import AttackAction from "./AttackAction.js";
import AttackCommandOptions, { attackTypes, damageTypes } from "./AttackCommandOptions.js";
import { InstantRoll } from "@nwod-angel/nwod-roller";

const symbols = {
    helmet: '🪖',
    blood: '🩸',
    bomb: '💣',
    damage: '💥',
    die: '🎲',
    firecracker: '🧨',
    runningShoe: '👟',
    personRunning: '🏃',
    hammer: '🔨',
    axe: '🪓',
    pick: '⛏️',
    dagger: '🗡️',
    crossedSwords: '⚔️',
    waterPistol: '🔫',
    boomerang: '🪃',
    shield: '🛡️',
    anger: '💢',
    prohibited: '🚫',
    personShrugging: '🤷',
}

export const AttackCommand: Command = {
    name: "attack",
    description: "Makes an attack roll",
    type: ApplicationCommandType.ChatInput,
    options: AttackCommandOptions,
    run: async (client: Client, interaction: CommandInteraction) => {


        let name = interaction.options.get('name')?.value?.toString() || interaction.member?.user.username || 'A user'
        let target = interaction.options.get('target')?.value?.toString() || 'their target'
        let description = interaction.options.get('description')?.value?.toString() || undefined
        let attackTypeId = interaction.options.get('attack-type')!.value!.toString()
        let attackType = attackTypes.find(at => at.id === attackTypeId)!

        let attackerDicePool = Number(interaction.options.get('attacker-dice-pool')!.value)
        let weaponBonus = Number(interaction.options.get('weapon-bonus')?.value)
        let weaponDamage = Number(interaction.options.get('weapon-damage')?.value)
        let damageTypeId = interaction.options.get('damage-type')?.value?.toString() || undefined
        let damageType = damageTypeId ? damageTypes.find(dt => dt.id === damageTypeId) : undefined
        let allOutAttack = Boolean(interaction.options.get('all-out')?.value || false)

        let successThreshold = Number(interaction.options.get('success-threshold')?.value) || undefined
        let rerollThreshold = Number(interaction.options.get('reroll-threshold')?.value) || undefined
        let rote = Boolean(interaction.options.get('rote')?.value) || undefined

        let defenceLostTo = ''

        let mods = []
        // Generate the values mod-1 to mod-9 and lookup the interaction.  If the value exists add it to the mods array
        for (let i = 1; i <= 9; i++) {
            let modValue = interaction.options.get(`mod-${i}`)?.value?.toString()
            if (modValue) {
                mods.push({ mod: parseInt(modValue), description: modValue.substring(modValue.indexOf(' ') + 1).trim() || `mod-${i}` })
            }
        }

        if (weaponBonus) {
            mods.push({ mod: weaponBonus, description: `${attackType.symbol} Weapon Bonus` })
        }
        if (allOutAttack) {
            if (defenceLostTo) {
                interaction.followUp({ content: "Unable to lose defense more than once." })
                return
            }
            mods.push({ mod: 2, description: `${symbols.anger} All out Attack` })
            defenceLostTo = `${symbols.anger} All out Attack`
        }


        // let targets = Number(interaction.options.get('targets')?.value || 1)

        // let attack = new AttackAction({
        //     dicePoolModifiers: Array<{ type: string, value: string, modifier: number }>(),
        //     dicePoolModifiersTotal: 0,
        //     dicePoolDescription: '',
        //     action: interaction.options.get('action')?.value || 'instant',
        //     targets: Number(interaction.options.get('targets')?.value || 1),
        //     size: Number(interaction.options.get('size')?.value || 1),
        // })

        // TODO Check for incompatible options. e.g. targets and radius

        let embed = new EmbedBuilder()
            .setTitle(`${name} makes an ${attackType.symbol} ${attackType.name} ${attackType.symbol} attack against ${target}!`)
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
        if (description) { embed.setDescription(description) }

        let modifierFields = []
        modifierFields.push({
            name: `${name}'s ${attackType.attribute} + ${attackType.skill}`,
            value: attackerDicePool.toString(),
            inline: true
        })

        mods.forEach(mod => {
            modifierFields.push({
                name: mod.description,
                value: mod.mod.toString(),
                inline: true
            })
        })

        if (successThreshold) {
            modifierFields.push({
                name: `Successes on`,
                value: successThreshold.toString(),
                inline: true
            })
        }

        if (rerollThreshold) {
            modifierFields.push({
                name: `Reroll on`,
                value: rerollThreshold.toString(),
                inline: true
            })
        }

        if (rote) {
            modifierFields.push({
                name: `Rote Action`,
                value: 'Rerolling failures once',
                inline: true
            })
        }

        embed.addFields(modifierFields)

        // Send a follow up then add the interactions afterwards
        interaction.followUp({
            embeds: [embed]
        })

        let readyToRoll = false

        let attackOptions = [
            {
                option: 'all-out-attack',
                actionComponent: new ButtonBuilder()
                    .setCustomId('all-out-attack')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("All out Attack")
                    .setEmoji(symbols.anger),
                action: (embed: EmbedBuilder, mods: {mod: number, description: string}[]) => {
                    mods.push({ mod: 2, description: `${symbols.anger} All out Attack` })
                    embed.addFields({
                        name: `${symbols.anger} All out Attack`,
                        value: '+2',
                        inline: true
                    })
                    
                }
            }
        ]

        while (!readyToRoll) {

            // TODO elict more options here

            let actionRows = new Array<ActionRowBuilder<ButtonBuilder>>()
            const buttonsPerRow = 5

            let actions = [
                new ButtonBuilder()
                        .setCustomId('roll')
                        .setStyle(ButtonStyle.Success)
                        .setLabel("Roll it!")
                        .setEmoji(symbols.die)
            ].concat(attackOptions.map(ao => ao.actionComponent))
            .concat([
                new ButtonBuilder()
                    .setCustomId('cancel')
                    .setStyle(ButtonStyle.Danger)
                    .setLabel("Cancel!")
                    .setEmoji(symbols.prohibited)
            ])
            // TODO Split over action rows
            actionRows.push(new ActionRowBuilder<ButtonBuilder>()
                .addComponents(actions)
            )

            let responseInteraction = await interaction.editReply({
                embeds: [embed],
                components: actionRows
            })


            try {
                const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 })

                switch (response.customId) {
                    case 'all-out-attack':
                        let attackOption = attackOptions.find(ao => ao.option === 'all-out-attack')
                        attackOption?.action(embed, mods)
                        attackOptions = attackOptions.filter(ao => ao.option !== attackOption?.option)
                        response.update({
                            embeds: [embed],
                            components: actionRows
                        })
                        break
                    case 'roll':
                        readyToRoll = true
                        break
                    case 'cancel':
                        await interaction.editReply({
                            content: "Cancelling...",
                            embeds: [],
                            components: []
                        })
                        setTimeout(() => { interaction.deleteReply() }, 10000);
                        return null
                }
            } catch (e) {
                // No response
                await interaction.editReply({
                    content: "No response after 60 seconds. Cancelling.",
                    embeds: [],
                    components: []
                })
                setTimeout(() => { interaction.deleteReply() }, 10000);
                return null
            }

            // Finished getting all the mods
        }

        const dicePool = Math.max(0, attackerDicePool + mods.reduce((sum, mod) => sum + mod.mod, 0))

        const instantRoll = new InstantRoll({ dicePool: dicePool, rote: rote, successThreshold: successThreshold, rerollThreshold: rerollThreshold })
        const rollDescription = instantRoll.toString()
        const successes = instantRoll.numberOfSuccesses()

        embed.addFields({
            name: `${symbols.die} ${name} rolled ${dicePool} dice and got ${successes} successes`,
            value: rollDescription
        })

        if (successes > 0) {
            let totalDamage = successes

            if (weaponDamage) {
                totalDamage += weaponDamage
                embed.addFields({
                    name: `${symbols.damage} Weapon damage`,
                    value: weaponDamage.toString(),
                    inline: true
                })
            }
            let weaponDamageDescription = weaponDamage ? `+ ${attackType.symbol} ${weaponDamage}` : ''
            embed.addFields({
                name: `${target} takes ${totalDamage} ${damageType ? damageType.name + ' ' : ''}damage`,
                value: `${symbols.die} ${successes}${weaponDamageDescription}${damageType ? '\n' + damageType.symbol.repeat(totalDamage) : ''}`,
            })
        }

        if (defenceLostTo) {
            embed.addFields({
                name: `${symbols.personShrugging} ${name} loses their defence`,
                value: `${defenceLostTo}`,
            })
        }

        await interaction.editReply({
            embeds: [embed],
            components: [],
        })
    }
}