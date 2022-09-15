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
    practiceString(): string {
        return Practice[this.practice].toString()
    }

    primaryArcanaRequirement(): Requirement {
        return this.requirements
            .filter(r => r.name.toLowerCase() === Arcana[this.primaryArcana].toString().toLowerCase())[0]
    }

    dots(): number | undefined {
        return this.primaryArcanaRequirement().dots
    }

    primaryArcanaRequirementString(): string {
        return this.primaryArcanaRequirement().toString()
    }

    titleString(): string {
        return `${this.name} (${this.primaryArcanaRequirementString()})`
    }

    requirementsString(): string {
        return this.requirements.map(r => `${r.name} ${'•'.repeat(r.dots!)}`).join('\n')
    }
}