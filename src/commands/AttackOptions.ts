import Attack from "./Attack";
import { AttackOption } from "./AttackOption";

export default [
    new AttackOption(
        'all-out-attack',
        'All out Attack',
        '💢',
        '+2 to attack, lose defense',
        'description',
        (attack: Attack) => {
            attack.mods.push({ mod: 2, description: `💢 All out Attack` })
            attack.defenceLostTo = `💢 All out Attack`
        }
    ),
    new AttackOption(
        'willpower-attack',
        'Attack with Willpower',
        '😠',
        '+3 to attack, -1 willpower',
        'description',
        (attack: Attack) => {
            attack.mods.push({ mod: 3, description: `😠 Attack with Willpower` })
            attack.willpowerUsedOn = `😠 Attack with Willpower`
        }
    ),
    new AttackOption(
        'willpower-defense',
        'Defend with Willpower',
        '😣',
        '-2 to attack',
        'description',
        (attack: Attack) => {
            attack.mods.push({ mod: -2, description: `😣 Defend with Willpower` })
        }
    )
]
