import Attack from "./Attack";
import { AttackOption } from "./AttackOption";

export default [
    new AttackOption(
        'all-out-attack',
        'All out Attack',
        '💢',
        '+2',
        'description',
        (attack: Attack) => {
            attack.mods.push({ mod: 2, description: `💢 All out Attack` })
            attack.defenceLostTo = `💢 All out Attack`
        }
    )
]