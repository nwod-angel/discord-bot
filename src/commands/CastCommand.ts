import { Interaction, Client, ApplicationCommandType, CommandInteraction } from "discord.js";
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
            dicePoolModifiers: [],
            dicePoolModifiersTotal: 0,
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
        
        const content = JSON.stringify(spell)

        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};
