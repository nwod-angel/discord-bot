import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";

export const AttackCommand: Command = {
    name: "attack",
    description: "Makes an attack roll",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "name",
            description: "The name of the attacker",
            type: 3, // String
            maxLength: 32
        },
        {
            name: "target",
            description: "The name of the target or targets of the attack",
            type: 3, // String
            maxLength: 32
        },
        {
            name: "description",
            description: "The description of the attack",
            type: 3, // String
            maxLength: 256
        },
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
            description: "Gun damage modifier doesn't add dice to hit. Damage applied if Dexterity + Firearms roll succeeds.",
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
            description: "Long, Medium, Short",
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
            description: "Ranged attacks over cover's Durability hit target behind, excess successes do Structure damage",
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
            description: "Shooter’s own concealment quality reduced by one as a penalty to fire back",
            type: 3, // String
            choices: [
                { name: 'Barely (-0)', value: 'barely' },
                { name: 'Partially (-1)', value: 'partially' },
                { name: 'Substantially (-2)', value: 'substantially' }
            ]
        },
        {
            name: "offhand",
            description: "Offhand Attack: -2 penalty",
            type: 5, // Boolean
        },
        {
            name: "prone-target",
            description: "Prone Target: -2 in ranged combat; +2 when attacker is within close-combat distance",
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

        let name = interaction.options.get('name')!.value?.toString() || interaction.member?.user.username || 'A user'
        let description = interaction.options.get('description')?.value?.toString() || undefined

        let attack = {
            dicePoolModifiers: Array<{ type: string, value: string, modifier: number }>(),
            dicePoolModifiersTotal: 0,
            dicePoolDescription: '',
            action: interaction.options.get('action')?.value || 'instant',
            targets: Number(interaction.options.get('targets')?.value || 1),
            size: Number(interaction.options.get('size')?.value || 1),
        }

        // TODO Check for incompatible options. e.g. targets and radius

        let embed = new EmbedBuilder()
            .setTitle(`${name} attacks! [Work in Progress]`)
            .setFooter({
                text: interaction.id,
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })
        if (description) { embed.setDescription(description) }

        await interaction.followUp({
            embeds: [embed]
        });
    }
};
