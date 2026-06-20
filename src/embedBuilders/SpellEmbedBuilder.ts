import { Spell } from "@nwod-angel/nwod-core";
import { EmbedBuilder } from "discord.js";
import { chunkText } from "./chunkText.js";

/**
 * Fluent builder for spell embeds.
 *
 * Usage:
 *   new SpellEmbed(spell)
 *     .withRequirements()
 *     .withDetails()
 *     .withDescription()
 *     .withSources()
 *     .build();
 */
export class SpellEmbed {
    private embed = new EmbedBuilder();

    constructor(private spell: Spell) {
        this.embed.setTitle(spell.titleString());
    }

    withRequirements(): this {
        if (this.spell.requirements && this.spell.requirements.length > 0) {
            this.embed.addFields({ name: 'Requirements', value: this.spell.requirementsString(), inline: false });
        }
        return this;
    }

    withDetails(): this {
        this.embed.addFields(
            { name: 'Practice', value: this.spell.practiceString(), inline: true },
            { name: 'Action', value: this.spell.action, inline: true },
            { name: 'Duration', value: this.spell.duration, inline: true },
            { name: 'Aspect', value: this.spell.aspect, inline: true },
            { name: 'Cost', value: this.spell.cost, inline: true },
        );
        return this;
    }

    withDescription(): this {
        const descriptionChunks = chunkText(this.spell.description);
        descriptionChunks.forEach((chunk: string, index: number) => {
            this.embed.addFields({ name: `Effect (${index + 1}/${descriptionChunks.length})`, value: chunk, inline: false });
        });
        return this;
    }

    withSources(): this {
        this.embed.addFields({ name: 'Sources', value: this.spell.sourcesString(), inline: false });
        return this;
    }

    build(): EmbedBuilder {
        return this.embed;
    }
}
