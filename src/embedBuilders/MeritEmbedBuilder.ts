import { MeritDefinition, NwodSymbols } from "@nwod-angel/nwod-core";
import { EmbedBuilder } from "discord.js";
import { chunkText } from "./chunkText.js";

const symbols = new NwodSymbols();

/**
 * Fluent builder for merit embeds.
 *
 * Usage:
 *   new MeritEmbed(merit)
 *     .withRequirements()
 *     .withDescription()
 *     .withLevels()
 *     .withSources()
 *     .build();
 */
export class MeritEmbed {
    private embed = new EmbedBuilder();

    constructor(private merit: MeritDefinition) {
        this.embed.setTitle(merit.titleString());
    }

    withRequirements(): this {
        if (this.merit.hasRequirements()) {
            this.embed.addFields({ name: 'Requirements', value: this.merit.requirementsString(), inline: false });
        }
        return this;
    }

    withDescription(): this {
        const descriptionChunks = chunkText(this.merit.description);
        descriptionChunks.forEach((chunk: string, index: number) => {
            this.embed.addFields({ name: `Effect ${index > 0 ? ' (continued)' : ''}`, value: chunk, inline: false });
        });
        return this;
    }

    withLevels(): this {
        this.merit.levels.forEach(level => {
            const levelDescriptionChunks = chunkText(level.description);
            levelDescriptionChunks.forEach((descriptionChunk: string, index: number) => {
                this.embed.addFields({
                    name: `${level.name || this.merit.name} ${symbols.MeritDot.repeat(level.level)} ${index > 0 ? ' (continued)' : ''}`,
                    value: descriptionChunk,
                    inline: false,
                });
            });
        });
        return this;
    }

    withSources(): this {
        this.embed.addFields({ name: 'Sources', value: this.merit.sourcesString(), inline: false });
        return this;
    }

    build(): EmbedBuilder {
        return this.embed;
    }
}
