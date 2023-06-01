import { Requirement, Source } from "@nwod-angel/nwod-core"
import { stringify } from "querystring";
import rules from "./rules";
import { RuleParagraph } from "./RuleParagraph";
import { RuleDefinition } from "./RuleDefinition";

export default class RuleProvider {
    static rules: Array<RuleDefinition>

    static getRules(name?: string, description?: string): Array<RuleDefinition> {
        return this.rules.filter(r =>
            (name === undefined || r.name.toLowerCase().includes(name.toLowerCase())) &&
            (description === undefined ||
                r.paragraphs.some(paragraph => paragraph.text.toLowerCase().includes(description.toLowerCase())))
        )
    }

    private static _initialize = (() => {
        console.log("Reading rules...")
        RuleProvider.rules =
            rules.map(rule => new RuleDefinition(
                rule.name,
                rule.prefix,
                rule.paragraphs.map(p => {
                    switch(typeof(p)){
                        case 'string':
                            return new RuleParagraph({ text: p })
                    }
                    return new RuleParagraph({
                        prefix: p.prefix,
                        text: p.text,
                        example: (p as { example: boolean }).example,
                    })
                }),
                rule.sources.map(s => new Source(s.sourceBook, parseInt(s.sourcePage))
                ))
            )

        // Health Checks
        // RuleProvider.rules.filter(rule => rule.description === '').forEach(rule => {
        //     console.log(`Rule has no description: ${rule.name} [${rule.sourcesString()}]`)
        // })
        RuleProvider.rules.filter(rule => rule.paragraphs.some(p => p.text.length > 1024)).forEach(rule => {
            console.log(`Rule has a long paragraph: ${rule.name} [${rule.sourcesString()}]`)
        })

    })()
}