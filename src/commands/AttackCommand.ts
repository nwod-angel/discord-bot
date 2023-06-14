import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";
import AttackAction from "./AttackAction.js";
import AttackCommandOptions, { attackTypes } from "./AttackCommandOptions.js";
import { InstantRoll } from "@nwod-angel/nwod-roller";

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

        let mods = []
        // Generate the values mod-1 to mod-9 and lookup the interaction.  If the value exists add it to the mods array
        for (let i = 1; i <= 9; i++) {
            let modValue = interaction.options.get(`mod-${i}`)?.value?.toString()
            if (modValue) {
                mods.push({ mod: parseInt(modValue), description: modValue.substring(modValue.indexOf(' ') + 1).trim() || `mod-${i}` })
            }
        }

        if(weaponBonus){
            mods.push({ mod: weaponBonus, description: `${attackType.symbol} Weapon Bonus`})
        }

        const totalMod = Math.max(0, attackerDicePool + mods.reduce((sum, mod) => sum + mod.mod, 0))

        const instantRoll = new InstantRoll({ dicePool: totalMod })
        const rollDescription = instantRoll.toString()
        const successes = instantRoll.numberOfSuccesses()

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
            .setTitle(`${name} makes an ${attackType.symbol}${attackType.name}${attackType.symbol} attack against ${target}! [Work in Progress]`)
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
        if (description) { embed.setDescription(description) }

        embed.addFields({
            name: `🎲 ${name} rolled ${instantRoll.dicePool} dice and got ${successes} successes`,
            value: rollDescription
        })

        embed.addFields({
            name: `${name}'s ${attackType.attribute} + ${attackType.skill}`,
            value: attackerDicePool.toString(),
            inline: true
        })

        mods.forEach(mod => {
            embed.addFields({
                name: mod.description,
                value: mod.mod.toString(),
                inline: true
            })
        })

        let totalDamage = successes

        if (weaponDamage) {
            totalDamage += weaponDamage
            embed.addFields({
                name: `💥 Weapon damage`,
                value: weaponDamage.toString(),
                inline: true
            })
        }
        let weaponDamageDescription = weaponDamage ? `+ ${attackType.symbol}${weaponDamage}` : ''
        embed.addFields({
            name: `${target} takes ${totalDamage} damage`,
            value: `🎲${successes}${weaponDamageDescription}`,
        })

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
