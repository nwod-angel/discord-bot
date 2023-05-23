
export class RuleParagraph {
    prefix?: string;
    text: string;
    example: boolean;
    table: boolean;

    constructor(
        { prefix, text, example, table }: {
            text: string;
            prefix?: string;
            example?: boolean;
            table?: boolean;
        }
    ) {
        this.text = text;
        this.prefix = prefix;
        this.example = example || false;
        this.table = table || false;
    }
}
