import ProductId from "./ProductId"

export default class Source {
    name: string
    pageFrom: number
    pageTo?: number
    productIds?: Array<ProductId>
    
    constructor (name: string, pageFrom: number, pageTo?: number, productIds?: Array<ProductId>){
        this.name = name
        this.pageFrom = pageFrom
        this.pageTo = pageTo
        this.productIds = productIds
    }
    pagesToString(): string {
        let pageTo = this.pageTo ? `-${this.pageTo}` : ''
        return `${this.pageFrom}${pageTo}`
    }
    sourceLink(): string {
        return this.name
        return `[${this.name}](https://www.drivethrurpg.com/browse.php?keywords=${encodeURIComponent(this.name)}&affiliate_id=299064)`
    }
    toString(): string {
        return `${this.sourceLink()} page ${this.pagesToString()}`
    }
}