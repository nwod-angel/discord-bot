import Source from "./Source"

export default class Spell {
    name: string
    description: string
    sources?: Array<Source>

    constructor (name: string, description: string, sources?: Array<Source>) {
        this.name = name
        this.description = description
        this.sources = sources
    }

    sourcesString (): string {
        return (this.sources || []).map(source => source.toString()).join('\n')
    }
}