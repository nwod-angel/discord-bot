import arcanum from "../../arcanum"
import { RuleParagraph } from "../../RuleParagraph"

export default arcanum.map(arcana => {
    return {
        name: `Arcana: ${arcana.name}`,
        prefix: "MtAw",
        sources: [
            {
                sourceBook: "MtAw",
                sourcePage: "-"
            }
        ],
        paragraphs:
            [new RuleParagraph({ prefix: 'Purview', text: arcana.purview.join(', ')})]
            .concat(arcana.description.map(d => new RuleParagraph({ text: d})))
            .concat([new RuleParagraph({ prefix: 'Tools', text: arcana.tools.join(', ')})])
    }
}) as any