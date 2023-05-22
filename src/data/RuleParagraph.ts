
export class RuleParagraph {
    prefix?: string;
    text: string;
    example: boolean;

    constructor(
        { prefix, text, example }: {
            text: string;
            prefix?: string;
            example?: boolean;
        }
    ) {
        this.text = text;
        this.prefix = prefix;
        this.example = example || false;
    }
}
