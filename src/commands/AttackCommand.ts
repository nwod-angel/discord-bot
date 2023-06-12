import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";

export const AttackCommand: Command = {
    name: "attack",
    description: "Makes an attack roll",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "attack-type",
            description: "Armor Piercing: Ignores amount of target’s armor equal to item’s own rating",
            type: 3, // String
            choices: [
                { name: 'Unarmed close combat: Strength + Brawl, minus target’s Defense and armor', value: 'unarmed-close-combat' },
                { name: 'Armed close combat: Strength + Weaponry, minus target’s Defense and armor', value: 'armed-close-combat' },
                { name: 'Ranged combat (guns and bows): Dexterity + Firearms, minus target’s armor', value: 'ranged-fired' },
                { name: 'Ranged combat (thrown weapons): Dexterity + Athletics, minus target’s Defense and armor', value: 'ranged-thrown' },
            ]
        },
        {
            name: "attacker-dice-pool",
            description: "Armor Piercing: Ignores amount of target’s armor equal to item’s own rating",
            type: 4, // Integer
            minValue: 0,
        },
        {
            name: "weapon-bonus",
            description: "A number of bonus dice are added to your pool equal to the rating of the tool or effect used.",
            type: 4, // Integer
            minValue: 0,
        },
        {
            name: "weapon-damage",
            description: "The damage modifier on a gun does not add dice to the roll to hit. Rather, the damage is applied automatically provided that the Dexterity + Firearms roll is successful.",
            type: 4, // Integer
            minValue: 0,
        },
        {
            name: "aiming",
            description: "Aiming: +1 per turn to a +3 maximum",
            type: 4, // Integer
            minValue: 1,
            maxValue: 3
        },
        {
            name: "all-out",
            description: "All-Out Attack: +2 with Brawl or Weaponry attack; lose Defense",
            type: 5, // Boolean
        },
        {
            name: "armor-piercing",
            description: "Armor Piercing: Ignores amount of target’s armor equal to item’s own rating",
            type: 4, // Integer
            minValue: 1,
        },
        {
            name: "burst",
            description: "Long: +3 per attack, -1 per extra target. Medium: +2 per attack, 1-3 targets, -1 per extra target.  Short: +1 to attack, single target.",
            type: 3, // String
            choices: [
                { name: 'Long: +3 per attack, -1 per extra target', value: 'long' },
                { name: 'Medium: +2 per attack, 1-3 targets, -1 per extra target', value: 'medium' },
                { name: 'Short: +1 to attack, single target', value: 'short' },
            ]
        },
        {
            name: "concealment",
            description: "Barely -1; partially -2; substantially -3; fully, see “Cover”",
            type: 3, // String
            choices: [
                { name: 'Barely', value: 'barely' },
                { name: 'Partially', value: 'partially' },
                { name: 'Substantially', value: 'substantially' },
                { name: 'Fully', value: 'fully' },
            ]
        },
        {
            name: "cover-durability",
            description: "Successful ranged attacks exceeding cover's Durability pass through, hitting the target behind while causing excess successes as Structure damage to the cover.",
            type: 4, // Integer
            minValue: 1,
        },
        {
            name: "dodge",
            description: "Double target’s Defense",
            type: 5, // Boolean
        },
        {
            name: "firing-from-concealment",
            description: "Shooter’s own concealment quality (-1, -2 or -3) reduced by one as a penalty to fire back (so, no modifier, -1 or -2)",
            type: 3, // String
            choices: [
                { name: 'Barely', value: 'barely' },
                { name: 'Partially', value: 'partially' },
                { name: 'Substantially', value: 'substantially' }
            ]
        },
        {
            name: "offhand",
            description: "Offhand Attack: -2 penalty",
            type: 5, // Boolean
        },
        {
            name: "prone-target",
            description: "Prone Target: -2 penalty to hit in ranged combat; +2 bonus to hit when attacker is within close-combat distance",
            type: 3, // String
            choices: [
                { name: 'Ranged', value: 'ranged' },
                { name: 'Close-combat', value: 'close-combat' }
            ]
        },
        {
            name: "range",
            description: "Range: -2 at medium range, -4 at long range",
            type: 3, // String
            choices: [
                { name: 'Medium', value: 'medium' },
                { name: 'Long', value: 'long' }
            ]
        },
        {
            name: "combatants-avoided",
            description: "Shooting into Close Combat: -2 per combatant avoided in a single shot (not applicable to autofire)",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "specified-target",
            description: "Specified Target: Torso -1, leg or arm -2, head -3, hand -4, eye -5",
            type: 3, // String
            choices: [
                { name: 'Torso', value: 'torso' },
                { name: 'Leg/Arm', value: 'legArm' },
                { name: 'Head', value: 'head' },
                { name: 'Hand', value: 'hand' },
                { name: 'Eye', value: 'eye' }
            ]
        },
        {
            name: "surprised-or-immobilised",
            description: "Surprised or Immobilized Target: Defense doesn’t apply",
            type: 5, // Boolean
        },
        {
            name: "targets",
            description: "Number of targets for multitargeted attacks.",
            type: 4, // Integer
            minValue: 1
        },
        {
            name: "willpower-attack",
            description: " Willpower: Add three dice in one roll or instance",
            type: 5, // Boolean
        },
        {
            name: "willpower-defence",
            description: "Willpower: +2 to a Resistance trait (Stamina, Resolve, Composure or Defense) in one roll or instance",
            type: 5, // Boolean
        },
    ],
    run: async (client: Client, interaction: CommandInteraction) => {

        let attack = {
            dicePoolModifiers: Array<{ type: string, value: string, modifier: number }>(),
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

        let embed = new EmbedBuilder()
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
            embed.setTitle(`${name} attacks! [Work in Progress]`)

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
