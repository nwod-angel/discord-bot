import { NwodSymbols } from "@nwod-angel/nwod-core"

const MAX_TITLE_LENGTH = 32
const MAX_DESCRIPTION_LENGTH = 256

export const attackTypes = [
    { name: 'Unarmed close combat', symbol: '👊', attribute: 'Strength', skill: 'Brawl', defense: true, armor: true, id: 'unarmed-close-combat' },
    { name: 'Armed close combat', symbol: '🪓', attribute: 'Strength', skill: 'Weaponry', defense: true, armor: true, id: 'armed-close-combat' },
    { name: 'Armed close combat (finesse)', symbol: '🗡️', attribute: 'Dexterity', skill: 'Weaponry', defense: true, armor: true, id: 'armed-close-combat-finesse' },
    { name: 'Ranged combat (guns and bows)', symbol: '🔫', attribute: 'Dexterity', skill: 'Firearms', defense: false, armor: true, id: 'ranged-fired' },
    { name: 'Ranged combat (thrown weapons)', symbol: '⚾', attribute: 'Dexterity', skill: 'Athletics', defense: true, armor: true, id: 'ranged-thrown' },
]

export const burstTypes = [
    { name: 'Long', maxTargets: 50, bonus: 3, modPerExtraTarget: -1, id: 'long' },
    { name: 'Medium', maxTargets: 3, bonus: 2, modPerExtraTarget: -1, id: 'medium' },
    { name: 'Short', maxTargets: 1, bonus: 1, modPerExtraTarget: 0, id: 'short' },
]

export const concealmentTypes = [
    { name: 'Barely', attackMod: -1, id: 'barely' },
    { name: 'Partially', attackMod: -2, id: 'partially' },
    { name: 'Substantially', attackMod: -3, id: 'substantially' },
    { name: 'Fully', specialRules: 'Cover', id: 'fully' },
]
const symbolLibrary = new NwodSymbols()
export const damageTypes = [
    { name: 'Bashing', symbol: symbolLibrary.HealthBoxBashing, id: 'bashing' },
    { name: 'Lethal', symbol: symbolLibrary.HealthBoxLethal, id: 'lethal' },
    { name: 'Aggravated', symbol: symbolLibrary.HealthBoxAggravated, id: 'aggravated' },
    { name: 'Bashing (Resistant)', symbol: '!' + symbolLibrary.HealthBoxBashing, id: 'bashing-resistant' },
    { name: 'Lethal (Resistant)', symbol: '!' + symbolLibrary.HealthBoxLethal, id: 'lethal-resistant' },
    { name: 'Aggravated (Resistant)', symbol: '!' + symbolLibrary.HealthBoxAggravated, id: 'aggravated-resistant' }
]

const modsOptions = [
    {
        name: "mod-1",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-2",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-3",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-4",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-5",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-6",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-7",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-8",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    },
    {
        name: "mod-9",
        description: "Extra modifier followed by an option description. (e.g. `-4 Darkness` or `+3 Enhanced Dexterity)",
        type: 3, // String
    }
]

export default [
    {
        name: "attack-type",
        description: "The type of attack being made",
        type: 3, // String
        required: true,
        choices: attackTypes.map(at => ({ name: `${at.symbol} ${at.name}: ${at.attribute} + ${at.skill}, minus target's ${[at.defense ? 'Defence' : undefined, at.armor ? 'Armor' : undefined].filter(Boolean).join(' and ')}`, value: at.id }))
    },
    {
        name: "attacker-dice-pool",
        description: "The attackers dice pool based on the type of attack",
        type: 4, // Integer
        required: true,
        minValue: 0,
    },
    {
        name: "name",
        description: "The name of the attacker",
        type: 3, // String
        maxLength: MAX_TITLE_LENGTH,
        default: undefined
    },
    {
        name: "target",
        description: "The name of the target or targets of the attack",
        type: 3, // String
        maxLength: MAX_DESCRIPTION_LENGTH
    },
    {
        name: "description",
        description: "The description of the attack",
        type: 3, // String
        maxLength: MAX_DESCRIPTION_LENGTH
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
        name: "damage-type",
        description: "What type of damage the attack inflicts.",
        type: 3, // String
        choices: damageTypes.map(dt => ({
            name: `${dt.name} ${dt.symbol}`,
            value: dt.id
        }))
    },
    // {
    //     name: "aiming",
    //     description: "Aiming: +1 per turn to a +3 maximum",
    //     type: 4, // Integer
    //     minValue: 1,
    //     maxValue: 3
    // },
    {
        name: "all-out",
        description: "All-Out Attack: +2 with Brawl or Weaponry attack; lose Defense",
        type: 5, // Boolean
    },
    // {
    //     name: "armor-piercing",
    //     description: "Armor Piercing: Ignores amount of target’s armor equal to item’s own rating",
    //     type: 4, // Integer
    //     minValue: 1,
    // },
    // {
    //     name: "burst",
    //     description: "Long, Medium, Short",
    //     type: 3, // String
    //     choices: burstTypes.map(bt => ({ name: `${bt.name}: +${bt.bonus} per attack, max ${bt.maxTargets} target/s${ bt.modPerExtraTarget > 0 ? `, ${bt.modPerExtraTarget} per extra target` : ''}`, value: bt.id }))
    // },
    // {
    //     name: "concealment",
    //     description: "Barely -1; partially -2; substantially -3; fully, see “Cover”",
    //     type: 3, // String
    //     choices: concealmentTypes.map(ct => ({ name: `${ct.name}: ${[(ct.attackMod !== 0 ? ct.attackMod : null), (ct.specialRules ? `see '${ct.specialRules}'` : null)].filter(Boolean).join(', ')}`, value: ct.id }))
    // },
    // {
    //     name: "cover-durability",
    //     description: "Ranged attacks over cover's Durability hit target behind, excess successes do Structure damage",
    //     type: 4, // Integer
    //     minValue: 1,
    // },
    // {
    //     name: "dodge",
    //     description: "Double target’s Defense",
    //     type: 5, // Boolean
    // },
    // {
    //     name: "firing-from-concealment",
    //     description: "Shooter’s own concealment quality reduced by one as a penalty to fire back",
    //     type: 3, // String
    //     choices: [
    //         { name: 'Barely (-0)', value: 'barely' },
    //         { name: 'Partially (-1)', value: 'partially' },
    //         { name: 'Substantially (-2)', value: 'substantially' }
    //     ]
    // },
    // {
    //     name: "offhand",
    //     description: "Offhand Attack: -2 penalty",
    //     type: 5, // Boolean
    // },
    // {
    //     name: "prone-target",
    //     description: "Prone Target: -2 in ranged combat; +2 when attacker is within close-combat distance",
    //     type: 3, // String
    //     choices: [
    //         { name: 'Ranged', value: 'ranged' },
    //         { name: 'Close-combat', value: 'close-combat' }
    //     ]
    // },
    // {
    //     name: "range",
    //     description: "Range: -2 at medium range, -4 at long range",
    //     type: 3, // String
    //     choices: [
    //         { name: 'Medium', value: 'medium' },
    //         { name: 'Long', value: 'long' }
    //     ]
    // },
    // {
    //     name: "combatants-avoided",
    //     description: "Shooting into Close Combat: -2 per combatant avoided in a single shot (not applicable to autofire)",
    //     type: 4, // Integer
    //     minValue: 1
    // },
    // {
    //     name: "specified-target",
    //     description: "Specified Target: Torso -1, leg or arm -2, head -3, hand -4, eye -5",
    //     type: 3, // String
    //     choices: [
    //         { name: 'Torso', value: 'torso' },
    //         { name: 'Leg/Arm', value: 'legArm' },
    //         { name: 'Head', value: 'head' },
    //         { name: 'Hand', value: 'hand' },
    //         { name: 'Eye', value: 'eye' }
    //     ]
    // },
    // {
    //     name: "surprised-or-immobilised",
    //     description: "Surprised or Immobilized Target: Defense doesn’t apply",
    //     type: 5, // Boolean
    // },
    // {
    //     name: "targets",
    //     description: "Number of targets for multitargeted attacks.",
    //     type: 4, // Integer
    //     minValue: 1
    // },
    // {
    //     name: "willpower-attack",
    //     description: " Willpower: Add three dice in one roll or instance",
    //     type: 5, // Boolean
    // },
    // {
    //     name: "willpower-defence",
    //     description: "Willpower: +2 to a Resistance trait (Stamina, Resolve, Composure or Defense) in one roll or instance",
    //     type: 5, // Boolean
    // },
    {
        name: "rote",
        description: "Rote actions re-roll failures once",
        type: 5 // Boolean
    },
    {
        name: "success-threshold",
        description: "The lowest number on the die representing a success (default: 8)",
        type: 4 // Integer
    },
    {
        name: "reroll-threshold",
        description: "The lowest number on the die representing a reroll (default: 10)",
        type: 4 // Integer
    },
].concat(modsOptions as any)