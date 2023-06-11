import { EmbedBuilder, Client, ApplicationCommandType, CommandInteraction, ColorResolvable } from "discord.js";
import { Command } from "../Command";
import { InstantRoll } from "@nwod-angel/nwod-roller";
import { ExtendedRoll } from "@nwod-angel/nwod-roller";
import { RollResult } from "@nwod-angel/nwod-roller";
import DiscordChannelLogger from "../DiscordChannelLogger";

export const Roll: Command = {
    name: "roll",
    description: "Rolls dice",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "dice-pool",
            "description": "This number of dice will be rolled",
            "type": 4, // Integer
            "required": true,
            "minValue": 0
        },
        {
            "name": "name",
            "description": "The name of the entity rolling [optional]",
            "type": 3 // String
        },
        {
            "name": "description",
            "description": "The description of the roll [optional]",
            "type": 3 // String
        },
        {
            "name": "success-threshold",
            "description": "The lowest number on the die representing a success (default: 8)",
            "type": 4 // Integer
        },
        {
            "name": "reroll-threshold",
            "description": "The lowest number on the die representing a reroll (default: 10)",
            "type": 4 // Integer
        },
        {
            "name": "extended-rolls",
            "description": "If defined the roll will be extended and rolled this many times",
            "type": 4 // Integer
        },
        {
            "name": "target",
            "description": "If defined an extended roll will stop after this many successes [optional]",
            "type": 4 // Integer
        },
        {
            "name": "rote",
            "description": "Rote actions re-roll failures once (default: false)",
            "type": 5 // Boolean
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {

        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, options: interaction.options})
        
        let dicePool = Number(interaction.options.get('dice-pool')!.value)

        let name = interaction.member?.user.username
        if(interaction.options.get('name')){
            name = `*${interaction.options.get('name')!.value?.toString()!}*`
        }

        var description = ''
        if(interaction.options.get('description')){
            description = `*${interaction.options.get('description')!.value?.toString()!}*`
        }

        var successThreshold = undefined
        if(interaction.options.get('success-threshold')){
            successThreshold = Number(interaction.options.get('success-threshold')!.value)
        }

        var rerollThreshold = undefined
        if(interaction.options.get('reroll-threshold')){
            rerollThreshold = Number(interaction.options.get('reroll-threshold')!.value)
        }

        var extendedRolls = undefined
        if(interaction.options.get('extended-rolls')){
            extendedRolls = Number(interaction.options.get('extended-rolls')!.value)
        }

        var target = undefined
        if(interaction.options.get('target')){
            target = Number(interaction.options.get('target')!.value)
        }

        var action = 'instant'
        if(extendedRolls !== undefined){
            action = 'extended'
        }

        var rote = false
        if(interaction.options.get('rote')){
            rote = Boolean(interaction.options.get('rote')!.value)
        }

        var rollDescription = ''
        var result = new Number()
        var successes = new Number()

        switch (action) {
            case 'instant':
                var instantRoll = new InstantRoll({dicePool: dicePool, rote: rote, successThreshold: successThreshold, rerollThreshold: rerollThreshold})
                rollDescription = instantRoll.toString()
                successes = instantRoll.numberOfSuccesses()
                result = instantRoll.result()
                break
            case 'extended':
                var extendedRoll = new ExtendedRoll({dicePool: dicePool, rote: rote, successThreshold: successThreshold, rerollThreshold: rerollThreshold, extendedRolls: extendedRolls, target: target})
                rollDescription = extendedRoll.toString()
                successes = extendedRoll.numberOfSuccesses()
                result = extendedRoll.result()
                break
        }

        // Report Result
        var colour = 'White'
        var actionResult = ''

        switch (result) {
            case RollResult.critical_failure:
                colour = 'Black'
                actionResult = "💀 Critical Failure! "// + this.randomFromList(this.emojis.criticalFailure)
                break
            case RollResult.exceptional_success:
                colour = 'Yellow'
                actionResult = "⭐ Exceptional Success! "// + this.randomFromList(this.emojis.exceptionalSuccess)
                break
            case RollResult.failure:
                colour = 'Red'
                actionResult = "❌ Failure "// + this.randomFromList(this.emojis.failure)
                break
            case RollResult.success:
                colour = 'Green'
                actionResult = "✅ Success "// + this.randomFromList(this.emojis.success) 
                break
        }

		// https://discordjs.guide/popular-topics/embeds.html#using-the-embed-constructor
		let embed = new EmbedBuilder()

        .setTitle([actionResult, description].join(' '))
        .setColor(colour as ColorResolvable)
        // .addFields(
        //     {
        //         name: `${name} rolled ${dicePool} dice and got __${successes} success${(successes === 1 ? '' : 'es')}__.`,
        //         value: rollDescription.slice(0, 1023)
        //     }
        // )
	    .setFooter({ 
            text: interaction.id, 
            // iconURL: 'https://i.imgur.com/AfFp7pu.png'
        });

        // https://regex101.com/r/mk5e6E/1
        let descriptionChunks = rollDescription.match(/(?:(?:.){1,1000}(?:$|\n)|(?:.){1,1000}(?: |$|\n))/sgm) || []
        descriptionChunks.forEach((chunk: string, index: number) => {
            embed.addFields({ name: index == 0 ? `${name} rolled ${dicePool} dice and got __${successes} success${(successes === 1 ? '' : 'es')}__.` : `(continued)`, value: chunk, inline: false })
        })

        await interaction.followUp({
            embeds: [embed]
        });
        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})
    }
};
