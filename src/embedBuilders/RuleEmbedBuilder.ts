import { EmbedBuilder } from "discord.js";
import { RuleDefinition } from "../data/RuleDefinition.js";
import { chunkText } from "./chunkText.js";

export const RuleEmbedBuilder = {

    buildSingleRuleEmbed(rule: RuleDefinition, embed: EmbedBuilder) {
        embed.setTitle(rule.name)

        rule.paragraphs.forEach(paragraph => {
            if (paragraph.example) {
                embed.addFields({ name: 'Example', value: `*${paragraph.text.slice(0, 1022)}*`, inline: false })
            } else if (paragraph.prefix) {
                const textChunks = chunkText(paragraph.text, 1024)
                textChunks.forEach((chunk: string, index: number) => {
                    embed.addFields({ name: paragraph.prefix, value: chunk, inline: false })
                })
            } else if (paragraph.text) {
                const textChunks = chunkText(paragraph.text, 1024)
                textChunks.forEach((chunk: string, index: number) => {
                    embed.addFields({ name: '\u200b', value: chunk, inline: false })
                })
            }
        })

        embed.addFields({ name: 'Sources', value: rule.sourcesString(), inline: false })
    },

    buildMultipleRulesEmbed(rules: RuleDefinition[], name?: string, search?: string, embed?: EmbedBuilder) {
        const rulesToDisplay = rules.slice(0, 25)
        const ruleTitles = rulesToDisplay.map(s => s.name).join('\n')
        const searchTerms = [name ? `Name: ${name}` : null, search ? `Search: ${search}` : null].filter(Boolean).join('\n')

        embed!
            .setTitle(`Showing ${rulesToDisplay.length} of ${rules.length}`)
            .addFields(
                { name: `Search`, value: searchTerms, inline: false },
            )
            .addFields(
                { name: `Showing ${rulesToDisplay.length} of ${rules.length}`, value: ruleTitles, inline: false },
            )
    }
}
