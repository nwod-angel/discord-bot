import Source from "./Source";

export default class Rule {
    sources?: Array<Source>

    constructor (sources?: Array<Source>) {
        this.sources = sources
    }

    sourcesString (): string {
        return (this.sources || []).map(source => source.toString()).join('\n')
    }
}