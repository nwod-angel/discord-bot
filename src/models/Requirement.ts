export default class Requirement {

    name: string
    type?: string
    dots?: number

    constructor (name: string, type?: string, dots?: number) {
        this.name = name
        this.type = type
        this.dots = dots
    }

    toString() {
        let dots = this.dots ? '•'.repeat(this.dots) : ''
        return [this.name, dots].join(' ')
    }

    toVerboseString() {
        let type = this.type ? `[${this.type}]` : ''
        let dots = this.dots ? '•'.repeat(this.dots) : ''
        return [this.name, type, dots].join(' ')
    }
}