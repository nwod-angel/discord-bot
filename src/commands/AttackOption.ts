import Attack from "./Attack";




type ApplyFunction = (attack: Attack) => void
type FilterFunction = (attack: Attack) => boolean

export class AttackOption {
    id: string;
    name: string;
    symbol: string;
    summary: string;
    description: string;
    apply: ApplyFunction;
    _filter?: FilterFunction;

    constructor({
        id,
        name,
        symbol,
        summary,
        description,
        apply,
        filter
    }: { 
        id: string,
        name: string,
        symbol: string,
        summary: string,
        description: string,
        apply: ApplyFunction,
        filter?: FilterFunction
    }) {
        this.id = id
        this.name = name
        this.symbol = symbol
        this.summary = summary
        this.description = description
        this.apply = apply
        this._filter = filter || undefined
    }
    fancyName() { return `${this.symbol} ${this.name}`; }
    filter(attack: Attack) {
        if(!this._filter) return false
        return this._filter(attack)
    }
}
