import { Source, Rule } from "@nwod-angel/nwod-core";
import { RuleParagraph } from "./RuleParagraph";

export class RuleDefinition extends Rule {
    name: string;
    paragraphs: Array<RuleParagraph>;

    constructor(
        name: string,
        paragraphs: Array<RuleParagraph>,
        sources?: Array<Source>) {
        super(sources);
        this.name = name;
        this.paragraphs = paragraphs;
    }
}
