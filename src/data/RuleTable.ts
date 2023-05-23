
export class RuleTable {
    headers: Array<string>
    rows: Array<Array<string>>

    constructor(
            headers: Array<string>,
            rows: Array<Array<string>>
    ) {
        this.headers = headers;
        this.rows = rows;
    }
}
