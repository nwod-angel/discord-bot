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
        let description = interaction.options.get('description')?.value?.toString() || undefined
        let attackTypeId = interaction.options.get('attack-type')!.value!.toString()
        let attackType = attackTypes.find(at => at.id === attackTypeId)!

        let attackerDicePool = Number(interaction.options.get('attacker-dice-pool')!.value)

        const totalMod = Math.max(0, attackerDicePool)

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
            .setTitle(`${name} makes an ${attackType.symbol}${attackType.name}${attackType.symbol} attack! [Work in Progress]`)
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
        if (description) { embed.setDescription(description) }

        embed.addFields({
            name: `🎲 ${name} rolled ${instantRoll.dicePool} dice and got ${successes} successes`,
            value: rollDescription
        })

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
