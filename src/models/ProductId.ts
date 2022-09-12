import ProductSource from "./ProductSource"

export default class ProductId {
    id: string
    source: ProductSource
    constructor (id: string, source: ProductSource) {
        this.id = id
        this.source = source
    }
}