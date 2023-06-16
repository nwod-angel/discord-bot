export default class Attack {
    mods: { mod: number; description: string; }[];
    defenceLostTo: string | undefined;
    rerollThreshold: number | undefined;
    rote: boolean | undefined;
    successThreshold: number | undefined;
    allOutAttack: boolean | undefined;
    damageType: { name: string; symbol: string; id: string; } | undefined;
    weaponDamage: number | undefined;
    weaponBonus: number | undefined;
    attackerDicePool: number | undefined;
    attackType: { name: string; symbol: string; attribute: string; skill: string; defense: boolean; armor: boolean; id: string; } | undefined;
    description: string | undefined;
    target: string | undefined;
    name: string | undefined;

    constructor (){
        this.mods = new Array<{ mod: number; description: string; }>()
    }

}
