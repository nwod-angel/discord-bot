import { Requirement, Source } from "@nwod-angel/nwod-core"
import { stringify } from "querystring";
import rules from "./rules";
import { RuleParagraph } from "./RuleParagraph";
import { RuleDefinition } from "./RuleDefinition";

export default class RuleProvider {
    static rules: Array<RuleDefinition>

    static getRules(name?: string, description?: string): Array<RuleDefinition> {
        return this.rules.filter(r =>
            (name === undefined || r.name.toLowerCase().includes(name.toLowerCase())) && true
            // (description === undefined || r.description.toLowerCase().includes(description.toLowerCase()))
        )
    }

    private static _initialize = (() => {
        RuleProvider.rules =
            rules.map(rule => new RuleDefinition(
                rule.name,
                rule.paragraphs.map(p => 
                    typeof(p) === 'string'
                        ? new RuleParagraph({ text: p })
                        : new RuleParagraph({ prefix: p.prefix, text: p.text, example: p.example })),
                rule.sources.map(s => new Source(s.sourceBook, parseInt(s.sourcePage))
                ))
            )

        // Health Checks
        // RuleProvider.rules.filter(rule => rule.description === '').forEach(rule => {
        //     console.log(`Rule has no description: ${rule.name} [${rule.sourcesString()}]`)
        // })

    })()
}