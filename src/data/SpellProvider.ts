import { Arcana, ArcanaType, Practice, PracticeType, Requirement, Source, Spell } from "@nwod-angel/nwod-core"
import spells from "./spells";

export default class SpellProvider {
    static spells: Array<Spell>

    static getSpells(name?: string, description?: string, arcana?: Arcana, practice?: Practice, dots?: number) : Array<Spell> {
        return this.spells.filter(s => 
            (name === undefined || s.name.toLowerCase().includes(name.toLowerCase())) &&
            (description === undefined || s.description.toLowerCase().includes(description.toLowerCase())) &&
            (arcana === undefined || s.primaryArcana === arcana) &&
            (practice === undefined || s.practice === practice)&&
            (dots === undefined || s.dots() === dots)
        )
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
        console.log('Max desc length: ' + Math.max(...SpellProvider.spells.map(s => s.description.length)))
    })();
}