import Requirement from "../models/Requirement";
import Source from "../models/Source";
import Spell from "../models/mage/Spell";
import spells from "./spells";
import { Arcana, ArcanaType } from "../models/mage/Arcana"
import { Practice, PracticeType } from "../models/mage/Practice";

export default class SpellProvider {
    static spells: Array<Spell>

    static getSpell(name: string) : Spell {
        return this.spells.filter(s => s.name === name)[0]
    }

    private static _initialize = (() => {

        SpellProvider.spells = 
        spells.map(spell => new Spell(
                        spell.name,
                        spell.description,
                        Arcana[spell.primaryArcana as ArcanaType],
                        spell.requirements.map(r => new Requirement(r.name, undefined, parseInt(r.dots!))),
                        Practice[spell.practice as PracticeType],
                        spell.action,
                        spell.duration,
                        spell.aspect,
                        spell.cost,
                        spell.sources.map(s => new Source(s.sourceBook, parseInt(s.sourcePage))
                        ))
        )
    })();
}