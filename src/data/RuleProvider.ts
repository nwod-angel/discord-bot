import { Requirement, Source } from "@nwod-angel/nwod-core"
import rules from "./rules";
import { RuleParagraph } from "./RuleParagraph";
import { RuleDefinition } from "./RuleDefinition";
import { logger } from "../logger.js";

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
        logger.debug("Reading rules...")
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
        //     logger.debug(`Rule has no description: ${rule.name} [${rule.sourcesString()}]`)
        // })
        RuleProvider.rules.filter(rule => rule.paragraphs.some(p => p.text.length > 1024)).forEach(rule => {
            logger.debug({ rule: rule.name, sources: rule.sourcesString() }, 'Rule has a long paragraph')
        })

    })()
}