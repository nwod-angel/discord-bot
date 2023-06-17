

export class AttackOption {
    id: string;
    name: string;
    symbol: string;
    summary: string;
    description: string;
    apply: Function;

    constructor(id: string, name: string, symbol: string, summary: string, description: string, apply: Function) {
        this.id = id;
        this.name = name;
        this.symbol = symbol;
        this.summary = summary;
        this.description = description;
        this.apply = apply;
    }
    fancyName() { return `${this.symbol} ${this.name}`; }
}
