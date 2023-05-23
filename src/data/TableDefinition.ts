import { Source, Rule } from "@nwod-angel/nwod-core";
import { Table } from "./Table";

export class TableDefinition extends Rule {
    name: string;
    table: Table;

    constructor(
        name: string,
        table: Table,
        sources?: Array<Source>) {
        super(sources);
        this.name = name;
        this.table = table;
    }
}
