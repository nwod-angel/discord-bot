const { SlashCommandBuilder } = require('@discordjs/builders');
import InstantRoll from '@nwod-angel/nwod-roller'

const Discord = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Rolls dice')
		.addStringOption(option => 
			option.setName('dice-pool')
				.setDescription('Base dice pool.')
				.setRequired(true)
		)
		// .addStringOption(option => 
		// 	option.setName('modifiers')
		// 		.setDescription('comma separated list of modifiers to the action (e.g. "+2 equipment, -2 poor lighting"')
		// )
		// .addStringOption(option => 
		// 	option.setName('description')
		// 		.setDescription('description of the action')
		// )
		.addNumberOption(option => 
			option.setName('extend-rolls')
				.setDescription('Number of rolls to make in an extended action')
		)
		.addNumberOption(option => 
			option.setName('target')
				.setDescription('Target number of successes on an extended action')
		)
		// .addStringOption(option => 
		// 	option.setName('name')
		// 		.setDescription('Name of the entity making the roll')
		// )
		.addBooleanOption(option => 
			option.setName('rote')
				.setDescription('Is the roll is a rote')
		)
		.addNumberOption(option => 
			option.setName('reroll')
				.setDescription('The reroll threshold (default is 10)')
		)
		.addNumberOption(option => 
			option.setName('success')
				.setDescription('The success threshold (default is 8)')
		)
		,
	async execute(interaction) {
		await interaction.deferReply()
		
		let b = new InstantRollParameters() 
		var roll = {}
		roll.dicePool = Number(interaction.options.getString('dice-pool'))

		if (interaction.options.getString('description')) {
			roll.description = interaction.options.getString('description')
		}
		if (interaction.options.getBoolean('rote')) {
			roll.roteAction = true
		}
		if (interaction.options.getNumber('reroll')) {
			roll.reroll = interaction.options.getNumber('reroll')
		}
		if (interaction.options.getNumber('success')) {
			roll.successOn = interaction.options.getNumber('success')
		}
		if (interaction.options.getNumber('extend-rolls')) {
			roll.extendedRollCount = interaction.options.getNumber('extend-rolls')
		}
		if (interaction.options.getNumber('target')) {
			roll.target = interaction.options.getNumber('target')
		}
		// if (interaction.options.getString('modifiers')) {
		// 	try {
		// 		action.modifiers = interaction.options.getString('modifiers').split(',').map(mod => {
		// 			return {	amount: mod.trim().split(' ')[0],
		// 								name: mod.trim().split(' ').slice(1).join(' ')  }
		// 			})
		// 	} catch (ex) {
		// 		logger.error("Error reading modifiers", ex)
		// 	}
		// }
		
		var roll = new InstantRoll(roll)
		

		let embed = new Discord.MessageEmbed()

		action.modifiers.forEach(m => roll.modifier(m.name, m.amount))

		let colour = 0xFFFFFF
		let actionResult = 'ERROR: result not found'

		switch (roll.wodRollResult()) {
			case wodRollResult.critical_failure:
				colour = 0x000000
				actionResult = "Critical Failure! "// + this.randomFromList(this.emojis.criticalFailure)
				break
			case wodRollResult.exceptional_success:
				colour = 0xffff00
				actionResult = "Exceptional Success! "// + this.randomFromList(this.emojis.exceptionalSuccess)
				break
			case wodRollResult.failure:
				colour = 0xff0000
				actionResult = "Failure "// + this.randomFromList(this.emojis.failure)
				break
			case wodRollResult.success:
				colour = 0x00ff00
				actionResult = "Success "// + this.randomFromList(this.emojis.success) 
				break
		}
		let title = actionResult

		embed.setTitle(title)
		embed.setColor(colour)

		let roleMods = roll.ruleModifiers()
		action.modifiers.forEach(m => roleMods.push(`${(m.amount >= 0 ? '+' : '')}${m.amount} ${m.name}`))
		let roleModsString = roleMods.join(', ')
		if(roleModsString.length > 0) roleModsString = `(${roleModsString}) `

		// TODO Page huge dice results
		embed.addFields(
			{
				name: `${roller} rolled ${roll.dicePoolSize()} dice ${roleModsString}and got __${roll.numberOfSuccesses()} success${(roll.numberOfSuccesses() === 1 ? '' : 'es')}__.`,
				value: roll.rollDescription().slice(0, 1023)
			}
		)

		await interaction.editReply({ embeds: [embed] });
	},
}
