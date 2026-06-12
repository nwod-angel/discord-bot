import { Requirement, Source } from "@nwod-angel/nwod-core"
import tables from "./tables";
import { TableDefinition } from "./TableDefinition";
import { Table } from "./Table";
import { logger } from "../logger.js";

export default class TableProvider {
    static tables: Array<TableDefinition>

    static getTables(name?: string): Array<TableDefinition> {
        return this.tables.filter(r =>
            (name === undefined || r.name.toLowerCase().includes(name.toLowerCase())) && true
            // (description === undefined || r.description.toLowerCase().includes(description.toLowerCase()))
        )
    }

    private static _initialize = (() => {
        logger.debug("Reading tables...")
        TableProvider.tables =
            tables.map(table => new TableDefinition(
                table.name,
                new Table(table.table.headers, table.table.rows),
                table.sources.map(s => new Source(s.sourceBook, parseInt(s.sourcePage))
                ))
            )

        // Health Checks
        // TableProvider.tables.filter(table => table.description === '').forEach(table => {
        //     logger.debug(`Table has no description: ${table.name} [${table.sourcesString()}]`)
        // })

    })()
}