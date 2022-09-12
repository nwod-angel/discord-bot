export default class ProductSource {
    name: string
    searchString: string
    productString: string
    affiliateId?: string

    constructor (name: string, searchString: string, productString: string, affiliateId?: string) {
        this.name = name
        this.searchString = searchString
        this.productString = productString
        this.affiliateId = affiliateId
    }
}