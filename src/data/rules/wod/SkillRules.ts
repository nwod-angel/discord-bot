import { RuleParagraph } from "../../RuleParagraph"
import skills from "../../skills"

export default skills.map(skill => {
    return {
        name: `Skill: ${skill.category}: ${skill.name}`,
        prefix: "Core",
        sources: [
            {
                sourceBook: "World of Darkness",
                sourcePage: "-"
            }
        ],
        paragraphs:  
        [
            new RuleParagraph({ text: skill.description}),
            new RuleParagraph({ prefix: 'Possessed By', text: skill.possessedBy.join(', ')}),
            new RuleParagraph({ prefix: 'Specialties', text: skill.specialties.join(', ')})
        ]
    }
})