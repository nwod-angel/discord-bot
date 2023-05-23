import { Table } from "./Table";

export class RuleParagraph {
    prefix?: string;
    text: string;
    example: boolean;
    table?: Table;

    constructor(
        { prefix, text, example, table }: {
            text: string;
            prefix?: string;
            example?: boolean;
            table?: Table;
        }
    ) {
        this.text = text;
        this.prefix = prefix;
        this.example = example || false;
        this.table = table;
    }
}
