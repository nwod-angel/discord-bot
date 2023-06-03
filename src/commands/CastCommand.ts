import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";

const durationAdvancedProlongedChoices = [
    { name: 'One scene/hour', value: 'scene' },
    { name: '24 hours', value: 'day' },
    { name: '2 days', value: '2days' },
    { name: 'One week', value: 'week' },
    { name: 'One month', value: 'month' },
    { name: 'Indefinite', value: 'indefinite' }
]

export const CastCommand: Command = {
    name: "cast",
    description: "Assists casting spells",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "action",
            description: "Is the spell cast as an instant or extended action (default: instant)",
            type: 3, // String
            choices: [
                { name: 'Instant', value: 'instant' },
                { name: 'Extended', value: 'extended' }
            ]
        },
        {
            name: "potency",
            description: "Desired potency of the spell (default: 1)",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "targets",
            description: "Number of targets to affect (default: 1)",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "size",
            description: "The size of the largest target (default: 5)",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "radius",
            description: "The radius, in yards, for area affecting spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "radius-advanced",
            description: "The radius, in yards, for advanced area affecting spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "volume",
            description: "The volume, in cubic yards, for volume affecting spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "volume-advanced",
            description: "The volume, in cubic yards, for advanced volume affecting spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "duration-turns",
            description: "The duration, in turns, for transitory spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "duration-hours",
            description: "The duration, in hours, for prolonged spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "duration-days",
            description: "The duration, in days, for prolonged spells",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "duration-advanced-prolonged",
            description: "The volume, in cubic yards, for advanced volume affecting spells",
            type: 3, // String
            choices: durationAdvancedProlongedChoices
        },

    ],
    run: async (client: Client, interaction: CommandInteraction) => {

        let spell = {
            dicePoolModifiers: Array<{type: string, value: string, modifier: number}>(),
            dicePoolModifiersTotal: 0,
            dicePoolDescription: '',
            action: interaction.options.get('action')?.value || 'instant',
            potency: Number(interaction.options.get('potency')?.value || 1),
            targets: Number(interaction.options.get('targets')?.value || 1),
            size: Number(interaction.options.get('size')?.value || 1),
            radius: Number(interaction.options.get('radius')?.value) || undefined,
            radius_advanced: Number(interaction.options.get('radius-advanced')?.value) || undefined,
            volume: Number(interaction.options.get('volume')?.value) || undefined,
            volume_advanced: Number(interaction.options.get('volume-advanced')?.value) || undefined,
            duration_turns: Number(interaction.options.get('duration-turns')?.value) || undefined,
            duration_hours: Number(interaction.options.get('duration-hours')?.value) || undefined,
            duration_days: Number(interaction.options.get('duration-days')?.value) || undefined,
            duration_advanced_prolonged: interaction.options.get('duration-advanced-prolonged')?.value || undefined
        }

        		// TODO Check for incompatible options. e.g. targets and radius

		switch(spell.action) {
			case 'instant':
				if (spell.potency > 1) {
					spell.dicePoolModifiers.push({ type: 'Potency', value: spell.potency.toString(), modifier: ((spell.potency - 1) * -2)})
				}			
				if (spell.targets > 1) {
					spell.dicePoolModifiers.push({ type: 'Targets', value: spell.targets.toString(), modifier: ((Math.ceil(Math.log2(spell.targets))) * -2)})
				}			
				if (spell.size > 5) {
					spell.dicePoolModifiers.push({ type: 'Size', value: spell.size.toString(), modifier: ((Math.ceil(Math.log2(spell.size))) * -2)})
				}
				if (spell.radius && spell.radius > 1) {
					spell.dicePoolModifiers.push({ type: 'Radius (yards)', value: spell.radius.toString(), modifier: ((Math.ceil(Math.log2(spell.radius))) * -2)})
				}	
				if (spell.radius_advanced && spell.radius_advanced > 1) {
					spell.dicePoolModifiers.push({ type: 'Advanced Radius (yards)', value: spell.radius_advanced.toString(), modifier: ((Math.ceil(Math.log(spell.radius_advanced)/Math.log(4))) * -2)})
				}	
				if (spell.volume && spell.volume > 1) {
					spell.dicePoolModifiers.push({ type: 'Volume (cubic yards)', value: spell.volume.toString(), modifier: ((Math.ceil(Math.log2(spell.volume/5))) * -2)})
				}	
				if (spell.volume_advanced && spell.volume_advanced > 1) {
					spell.dicePoolModifiers.push({ type: 'Advanced Volume (cubic yards)', value: spell.volume_advanced.toString(), modifier: ((Math.ceil(Math.log(spell.volume_advanced/5)/Math.log(4))) * -2)})
				}			
				if (spell.duration_turns && spell.duration_turns > 1) {
					if (spell.duration_turns === 2) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: -2})
					} else if (spell.duration_turns === 3) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: -4})
					} else if (spell.duration_turns > 3 && spell.duration_turns <= 5) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: -6})
					} else if (spell.duration_turns > 5 && spell.duration_turns <= 10) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: -8})
					} else {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: -6 - (2 * Math.ceil(spell.duration_turns / 10))})
					}
				}			
				if (spell.duration_hours && spell.duration_hours > 1) {
					if (spell.duration_hours === 2) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: -2})
					} else if (spell.duration_hours > 2 && spell.duration_hours <= 12) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: -4})
					} else if (spell.duration_hours > 12 && spell.duration_hours <= 24) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: -6})
					} else if (spell.duration_hours > 24 && spell.duration_hours <= 48) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: -8})
					} else {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: -6 - (2 * Math.ceil(spell.duration_hours / 48))})
					}
				}
				if (spell.duration_days) {
					if (spell.duration_days === 1) {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: -6})
					} else if (spell.duration_days === 2) {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: -8})
					} else {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: -6 - (2 * Math.ceil(spell.duration_days / 2))})
					}
				}
				if (spell.duration_advanced_prolonged) {
					switch (spell.duration_advanced_prolonged) {
						case 'scene':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One scene/hour', modifier: 0})
						break
						case 'day':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: '24 hours', modifier: -2})
						break
						case '2days':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: '2 days', modifier: -4})
						break
						case 'week':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One week', modifier: -6})
						break
						case 'month':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One month', modifier: -8})
						break
						case 'indefinite':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'Indefinite', modifier: -10})
						break
					}
				}
			break
			case 'extended':
				if (spell.potency > 1) {
					spell.dicePoolModifiers.push({ type: 'Potency', value: spell.potency.toString(), modifier: (spell.potency - 1)})
				}
				if (spell.targets > 1) {
					spell.dicePoolModifiers.push({ type: 'Targets', value: spell.targets.toString(), modifier: (Math.ceil(Math.log2(spell.targets)))})
				}
				if (spell.size > 5) {
					spell.dicePoolModifiers.push({ type: 'Size', value: spell.size.toString(), modifier: (Math.ceil(Math.log2(spell.size)))})
				}
				if (spell.radius && spell.radius > 1) {
					spell.dicePoolModifiers.push({ type: 'Radius (yards)', value: spell.radius.toString(), modifier: (Math.ceil(Math.log2(spell.radius)))})
				}
				if (spell.radius_advanced && spell.radius_advanced > 1) {
					spell.dicePoolModifiers.push({ type: 'Advanced Radius (yards)', value: spell.radius_advanced.toString(), modifier: (Math.ceil(Math.log(spell.radius_advanced)/Math.log(4)))})
				}	
				if (spell.volume && spell.volume > 1) {
					spell.dicePoolModifiers.push({ type: 'Volume (cubic yards)', value: spell.volume.toString(), modifier: (Math.ceil(Math.log2(spell.volume/5)))})
				}	
				if (spell.volume_advanced && spell.volume_advanced > 1) {
					spell.dicePoolModifiers.push({ type: 'Advanced Volume (cubic yards)', value: spell.volume_advanced.toString(), modifier: (Math.ceil(Math.log(spell.volume_advanced/5)/Math.log(4)))})
				}				
				if (spell.duration_turns && spell.duration_turns > 1) {
					if (spell.duration_turns === 2) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: 1})
					} else if (spell.duration_turns === 3) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: 2})
					} else if (spell.duration_turns > 3 && spell.duration_turns <= 5) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: 3})
					} else if (spell.duration_turns > 5 && spell.duration_turns <= 10) {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: 4})
					} else {
						spell.dicePoolModifiers.push({ type: 'Turns (transitory)', value: spell.duration_turns.toString(), modifier: 3 + Math.ceil(spell.duration_turns / 10)})
					}
				}			
				if (spell.duration_hours && spell.duration_hours > 1) {
					if (spell.duration_hours === 2) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: 1})
					} else if (spell.duration_hours > 2 && spell.duration_hours <= 12) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: 2})
					} else if (spell.duration_hours > 12 && spell.duration_hours <= 24) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: 3})
					} else if (spell.duration_hours > 24 && spell.duration_hours <= 48) {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: 4})
					} else {
						spell.dicePoolModifiers.push({ type: 'Hours (prolonged)', value: spell.duration_hours.toString(), modifier: 3 + Math.ceil(spell.duration_hours / 48)})
					}	
				}
				if (spell.duration_days) {
					if (spell.duration_days === 1) {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: 3})
					} else if (spell.duration_days === 2) {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: 4})
					} else {
						spell.dicePoolModifiers.push({ type: 'Days (prolonged)', value: spell.duration_days.toString(), modifier: 3 + Math.ceil(spell.duration_days / 2)})
					}
				}
				if (spell.duration_advanced_prolonged) {
					switch (spell.duration_advanced_prolonged) {
						case 'scene':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One scene/hour', modifier: 0})
						break
						case 'day':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: '24 hours', modifier: 1})
						break
						case '2days':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: '2 days', modifier: 2})
						break
						case 'week':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One week', modifier: 3})
						break
						case 'month':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'One month', modifier: 4})
						break
						case 'indefinite':
							spell.dicePoolModifiers.push({ type: 'Advanced prolonged', value: 'Indefinite', modifier: 5})
						break
					}
				}
			break
		}

		spell.dicePoolModifiersTotal = spell.dicePoolModifiers.reduce(function(prevValue, current, index, array) {
			return prevValue + current.modifier
		}, spell.dicePoolModifiersTotal)
		spell.dicePoolDescription = spell.dicePoolModifiers.map(dpm => `\`(${dpm.modifier})\` ${dpm.type} ${dpm.value}`).join('\n')
        
        
        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
            .setTitle(`Spellcasting factors mod (${spell.action}) = ${spell.dicePoolModifiersTotal}`)

            embed.addFields(
                { name: `Modifiers`, value: spell.dicePoolDescription}
            )
            
        await interaction.followUp({
            embeds: [embed]
        });
    }
};
