import { RuleTable } from "./RuleTable";

export class RuleParagraph {
    prefix?: string;
    text: string;
    example: boolean;
    table?: RuleTable;

    constructor(
        { prefix, text, example, table }: {
            text: string;
            prefix?: string;
            example?: boolean;
            table?: RuleTable;
        }
    ) {
        this.text = text;
        this.prefix = prefix;
        this.example = example || false;
        this.table = table;
    }
}
