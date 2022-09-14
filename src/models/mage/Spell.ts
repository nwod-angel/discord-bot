import { Arcana } from "./Arcana"
import { Practice } from "./Practice"
import Requirement from "../Requirement"
import Rule from "../Rule"
import Source from "../Source"

export default class Spell extends Rule {
    name: string
    description: string
    primaryArcana: Arcana
    requirements: Array<Requirement>
    practice: Practice
    action: string
    duration: string
    aspect: string
    cost: string

    constructor (
            name: string,
            description: string,
            primaryArcana: Arcana,
            requirements: Array<Requirement>,
            practice: Practice,
            action: string,
            duration: string,
            aspect: string,
            cost: string,
            sources?: Array<Source>) {
        super(sources)
        this.name = name
        this.description = description
        this.primaryArcana = primaryArcana
        this.requirements = requirements
        this.practice = practice
        this.action = action
        this.duration = duration
        this.aspect = aspect
        this.cost = cost
        this.sources = sources
    }

    titleString() {
        return `${this.name} (${this.primaryArcana} ${'•'.repeat(this.requirements.filter(r => r.name.toLowerCase() === this.primaryArcana.toString().toLowerCase())[0].dots!)})`
    }

    requirementsString() {
        return this.requirements.map(r => `${r.name} ${'•'.repeat(r.dots!)}`).join('\n')
    }
}