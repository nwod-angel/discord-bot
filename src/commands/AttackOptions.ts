import Attack from "./Attack";
import { AttackOption } from "./AttackOption";

export default [
    new AttackOption({
        id: 'all-out-attack',
        name: 'All out Attack',
        symbol: '💢',
        summary: '+2 to attack, lose defense',
        description: 'description',
        apply: (attack: Attack) => {
            attack.mods.push({ mod: 2, description: `💢 All out Attack` })
            attack.defenceLostTo = `💢 All out Attack`
        },
        filter: (attack: Attack) => {
            return (attack.attackType !== undefined) &&
                (['weaponry', 'brawl'].indexOf(attack.attackType.skill.toLowerCase()) > -1) &&
                (!attack.defenceLostTo)
        },
    }),
    new AttackOption({
        id: 'willpower-attack',
        name: 'Attack with Willpower',
        symbol: '😠',
        summary: '+3 to attack, -1 willpower',
        description: 'description',
        apply: (attack: Attack) => {
            attack.mods.push({ mod: 3, description: `😠 Attack with Willpower` })
            attack.willpowerUsedOn = `😠 Attack with Willpower`
        },
        filter: (attack: Attack) => {
            return !attack.willpowerUsedOn
        }
    }),
    new AttackOption({
        id: 'willpower-defense',
        name: 'Defend with Willpower',
        symbol: '😣',
        summary: '-2 to attack',
        description: 'description',
        apply: (attack: Attack) => {
            attack.mods.push({ mod: -2, description: `😣 Defend with Willpower` })
        }
    }),
    // new AttackOption({
    //     id: 'aiming',
    //     name: 'Aiming',
    //     symbol: '🎯',
    //     summary: '+1 per turn to a +3 maximum',
    //     description: 'description',
    //     apply: (attack: Attack) => {
    //         attack.mods.push({ mod: -2, description: `🎯 Defend with Willpower` })
    //     },
    //     filter: (attack: Attack) => {
    //         return (attack.attackType !== undefined) && (['weaponry', 'brawl'].indexOf(attack.attackType.skill.toLowerCase()) > -1)
    //     },
    //     minValue: 1,
    //     maxValue: 3    
    // }),
]
