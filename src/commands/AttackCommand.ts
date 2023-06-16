import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collector } from "discord.js";
import { Command } from "../Command.js";
import AttackAction from "./AttackAction.js";
import AttackCommandOptions, { attackTypes, damageTypes } from "./AttackCommandOptions.js";
import { InstantRoll } from "@nwod-angel/nwod-roller";
import Attack from "./Attack.js";

const CANCEL_WAIT_TIME = 5000

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

        let attack = new Attack()
        attack.name = interaction.options.get('name')?.value?.toString() || interaction.member?.user.username || 'A user'
        attack.target = interaction.options.get('target')?.value?.toString() || 'their target'
        attack.description = interaction.options.get('description')?.value?.toString() || undefined
        let attackTypeId = interaction.options.get('attack-type')!.value!.toString()
        attack.attackType = attackTypes.find(at => at.id === attackTypeId)!

        attack.attackerDicePool = Number(interaction.options.get('attacker-dice-pool')!.value)
        attack.weaponBonus = Number(interaction.options.get('weapon-bonus')?.value)
        attack.weaponDamage = Number(interaction.options.get('weapon-damage')?.value)
        let damageTypeId = interaction.options.get('damage-type')?.value?.toString() || undefined
        attack.damageType = damageTypeId ? damageTypes.find(dt => dt.id === damageTypeId) : undefined
        attack.allOutAttack = Boolean(interaction.options.get('all-out')?.value || false)

        attack.successThreshold = Number(interaction.options.get('success-threshold')?.value) || undefined
        attack.rerollThreshold = Number(interaction.options.get('reroll-threshold')?.value) || undefined
        attack.rote = Boolean(interaction.options.get('rote')?.value) || undefined

        attack.defenceLostTo = ''

        // Generate the values mod-1 to mod-9 and lookup the interaction.  If the value exists add it to the mods array
        for (let i = 1; i <= 9; i++) {
            let modValue = interaction.options.get(`mod-${i}`)?.value?.toString()
            if (modValue) {
                attack.mods.push({ mod: parseInt(modValue), description: modValue.substring(modValue.indexOf(' ') + 1).trim() || `mod-${i}` })
            }
        }

        if (attack.weaponBonus) {
            attack.mods.push({ mod: attack.weaponBonus, description: `${attack.attackType.symbol} Weapon Bonus` })
        }
        if (attack.allOutAttack) {
            if (attack.defenceLostTo) {
                interaction.followUp({ content: "Unable to lose defense more than once." })
                return
            }
            attack.mods.push({ mod: 2, description: `${symbols.anger} All out Attack` })
            attack.defenceLostTo = `${symbols.anger} All out Attack`
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
            .setTitle(`${attack.name} makes an ${attack.attackType.symbol} ${attack.attackType.name} ${attack.attackType.symbol} attack against ${attack.target}!`)
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
        if (attack.description) { embed.setDescription(attack.description) }

        embed.addFields({
            name: `${attack.name}'s ${attack.attackType.attribute} + ${attack.attackType.skill}`,
            value: attack.attackerDicePool.toString(),
            inline: true
        })

        attack.mods.forEach(mod => {
            embed.addFields({
                name: mod.description,
                value: mod.mod.toString(),
                inline: true
            })
        })

        if (attack.successThreshold) {
            embed.addFields({
                name: `Successes on`,
                value: attack.successThreshold.toString(),
                inline: true
            })
        }

        if (attack.rerollThreshold) {
            embed.addFields({
                name: `Reroll on`,
                value: attack.rerollThreshold.toString(),
                inline: true
            })
        }

        if (attack.rote) {
            embed.addFields({
                name: `Rote Action`,
                value: 'Rerolling failures once',
                inline: true
            })
        }

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
        // let componentReponse = null
        // while (!readyToRoll) {

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

            // if(componentReponse){
            //     componentReponse.update({
            //         embeds: [embed],
            //         components: actionRows
            //     })
            // }

            let responseInteraction = await interaction.editReply({
                embeds: [embed],
                components: actionRows
            })


            let collector = responseInteraction.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 })

            collector.on('collect', response => {
                if(response.customId === 'cancel'){
                    interaction.editReply({
                        content: "Cancelling...",
                        embeds: [],
                        components: []
                    }).then(() => {
                        setTimeout(() => { interaction.deleteReply() }, 10000);
                    })
                } else if(response.customId === 'roll'){
                    roll(interaction, embed, attack)
                } else {
                    let attackOption = attackOptions.find(ao => ao.option === 'all-out-attack')
                    attackOption?.action(embed, attack.mods)
                    attackOptions = attackOptions.filter(ao => ao.option !== attackOption?.option)
                    response.update({
                        embeds: [embed],
                        components: actionRows
                    })
                }
            })

            // try {
            //     const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 })

            //     switch (response.customId) {
            //         case 'all-out-attack':
            //             let attackOption = attackOptions.find(ao => ao.option === 'all-out-attack')
            //             attackOption?.action(embed, mods)
            //             attackOptions = attackOptions.filter(ao => ao.option !== attackOption?.option)
            //             response.update({
            //                 embeds: [embed],
            //                 components: actionRows
            //             })
            //             break
            //         case 'roll':
            //             readyToRoll = true
            //             break
            //         case 'cancel':
            //             await interaction.editReply({
            //                 content: "Cancelling...",
            //                 embeds: [],
            //                 components: []
            //             })
            //             setTimeout(() => { interaction.deleteReply() }, 10000);
            //             return null
            //     }
            // } catch (e) {
            //     // No response
            //     await interaction.editReply({
            //         content: "No response after 60 seconds. Cancelling.",
            //         embeds: [],
            //         components: []
            //     })
            //     setTimeout(() => { try { interaction.deleteReply() } catch { console.log(`${interaction.id} already deleted.`) } }, CANCEL_WAIT_TIME);
            //     return null
            // }

            // Finished getting all the mods
        // }

    }
}

function roll(interaction: CommandInteraction, embed: EmbedBuilder, attack: Attack): void {

    const dicePool = Math.max(0, (attack.attackerDicePool || 0) + (attack.mods?.reduce((sum, mod) => sum + mod.mod, 0) || 0))

    const instantRoll = new InstantRoll({ dicePool: dicePool, rote: attack.rote, successThreshold: attack.successThreshold, rerollThreshold: attack.rerollThreshold })
    const rollDescription = instantRoll.toString()
    const successes = instantRoll.numberOfSuccesses()

    embed.addFields({
        name: `${symbols.die} ${attack.name} rolled ${dicePool} dice and got ${successes} successes`,
        value: rollDescription
    })

    if (successes > 0) {
        let totalDamage = successes

        if (attack.weaponDamage) {
            totalDamage += attack.weaponDamage
            embed.addFields({
                name: `${symbols.damage} Weapon damage`,
                value: attack.weaponDamage.toString(),
                inline: true
            })
        }
        let weaponDamageDescription = attack.weaponDamage ? `+ ${attack.attackType?.symbol} ${attack.weaponDamage}` : ''
        embed.addFields({
            name: `${attack.target} takes ${totalDamage} ${attack.damageType ? attack.damageType.name + ' ' : ''}damage`,
            value: `${symbols.die} ${successes}${weaponDamageDescription}${attack.damageType ? '\n' + attack.damageType.symbol.repeat(totalDamage) : ''}`,
        })
    }

    if (attack.defenceLostTo) {
        embed.addFields({
            name: `${symbols.personShrugging} ${attack.name} loses their defence`,
            value: `${attack.defenceLostTo}`,
        })
    }

    interaction.editReply({
        embeds: [embed],
        components: [],
    })
}
