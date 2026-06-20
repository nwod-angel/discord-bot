import { EmbedBuilder } from "discord.js";
import { RuleDefinition } from "../data/RuleDefinition.js";
import { chunkText } from "./chunkText.js";

/** Max characters for a single embed field value. */
const FIELD_VALUE_MAX = 1024;

/** Max characters for an example field value (slightly less to allow italic wrapping). */
const EXAMPLE_MAX = 1022;

/** Max number of rules to display in a multi-rule embed. */
const MAX_RULES_DISPLAY = 25;

/**
 * Fluent builder for rule embeds.
 *
 * Usage for a single rule:
 *   new RuleEmbed(rule)
 *     .withParagraphs()
 *     .withSources()
 *     .build();
 *
 * Usage for multiple rules:
 *   RuleEmbed.buildMultipleRules(rules, { name, search });
 */
export class RuleEmbed {
    private embed = new EmbedBuilder();

    constructor(private rule: RuleDefinition) {
        this.embed.setTitle(rule.name);
    }

    withParagraphs(): this {
        this.rule.paragraphs.forEach(paragraph => {
            if (paragraph.example) {
                this.embed.addFields({ name: 'Example', value: `*${paragraph.text.slice(0, EXAMPLE_MAX)}*`, inline: false });
            } else if (paragraph.prefix) {
                const textChunks = chunkText(paragraph.text, FIELD_VALUE_MAX);
                textChunks.forEach((chunk: string) => {
                    this.embed.addFields({ name: paragraph.prefix, value: chunk, inline: false });
                });
            } else if (paragraph.text) {
                const textChunks = chunkText(paragraph.text, FIELD_VALUE_MAX);
                textChunks.forEach((chunk: string) => {
                    this.embed.addFields({ name: '\u200b', value: chunk, inline: false });
                });
            }
        });
        return this;
    }

    withSources(): this {
        this.embed.addFields({ name: 'Sources', value: this.rule.sourcesString(), inline: false });
        return this;
    }

    build(): EmbedBuilder {
        return this.embed;
    }

    /**
     * Build an embed showing multiple rules as a list.
     */
    static buildMultipleRules(
        rules: RuleDefinition[],
        opts: { name?: string; search?: string } = {},
    ): EmbedBuilder {
        const embed = new EmbedBuilder();
        const rulesToDisplay = rules.slice(0, MAX_RULES_DISPLAY);
        const ruleTitles = rulesToDisplay.map(s => s.name).join('\n');
        const searchTerms = [
            opts.name ? `Name: ${opts.name}` : null,
            opts.search ? `Search: ${opts.search}` : null,
        ].filter(Boolean).join('\n');

        embed
            .setTitle(`Showing ${rulesToDisplay.length} of ${rules.length}`)
            .addFields(
                { name: 'Search', value: searchTerms, inline: false },
            )
            .addFields(
                { name: `Showing ${rulesToDisplay.length} of ${rules.length}`, value: ruleTitles, inline: false },
            );

        return embed;
    }
}
