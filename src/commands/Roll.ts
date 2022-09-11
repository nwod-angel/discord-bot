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
            "description": "The name of the entity rolling",
            "type": 3 // String
        },
        {
            "name": "description",
            "description": "The description of the roll",
            "type": 3 // String
        },
        {
            "name": "extended-rolls",
            "description": "If defined the roll will be extended and rolled this many times",
            "type": 4 // Integer
        },
        {
            "name": "target",
            "description": "Some extended rolls have a target number of successes",
            "type": 4 // Integer
        },
        {
            "name": "rote",
            "description": "Rote actions re-roll failures once",
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
                var instantRoll = new InstantRoll({dicePool: dicePool, rote: rote})
                rollDescription = instantRoll.toString()
                successes = instantRoll.numberOfSuccesses()
                result = instantRoll.result()
                break
            case 'extended':
                var extendedRoll = new ExtendedRoll({dicePool: dicePool, rote: rote, extendedRolls: extendedRolls, target: target})
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
        .addFields(
            {
                name: `${name} rolled ${dicePool} dice and got __${successes} success${(successes === 1 ? '' : 'es')}__.`,
                value: rollDescription.slice(0, 1023)
            }
        )
	    .setFooter({ 
            text: 'Some footer text here', 
            // iconURL: 'https://i.imgur.com/AfFp7pu.png'
        });

        // 2000 character limit
        await interaction.followUp({
            ephemeral: true,
            embeds: [embed]
        });
        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})
    }
};
