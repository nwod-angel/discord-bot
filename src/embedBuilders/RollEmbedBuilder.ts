import {
  EmbedBuilder,
  ColorResolvable,
  Colors,
} from "discord.js";
import { chunkText } from "./chunkText.js";

/**
 * Map a RollResult code to a display label and Discord colour.
 */
export function resultPresentation(
  resultCode: number,
): { label: string; colour: ColorResolvable } {
  switch (resultCode) {
    case 1:
      return { label: "💀 Critical Failure!", colour: Colors.NotQuiteBlack };
    case 2:
      return { label: "❌ Failure", colour: Colors.Red };
    case 3:
      return { label: "✅ Success", colour: Colors.Green };
    case 4:
      return { label: "⭐ Exceptional Success!", colour: Colors.Yellow };
    default:
      return { label: "🎲 Roll", colour: Colors.Default };
  }
}

/**
 * Fluent builder for roll embeds.
 *
 * Usage:
 *   new RollEmbed({
 *     actionResult: label,
 *     description,
 *     name,
 *     dicePool,
 *     successes,
 *     rollDescription,
 *     colour,
 *     footerText,
 *   })
 *     .withThumbnail(url)
 *     .build();
 */
export class RollEmbed {
    private embed: EmbedBuilder;
    private name: string;
    private dicePool: number;
    private successes: number;

    constructor(params: {
        actionResult: string;
        description: string;
        name: string;
        dicePool: number;
        successes: number;
        rollDescription: string;
        colour: ColorResolvable;
        footerText: string;
    }) {
        this.name = params.name;
        this.dicePool = params.dicePool;
        this.successes = params.successes;

        this.embed = new EmbedBuilder()
            .setTitle([params.actionResult, params.description].join(" "))
            .setColor(params.colour)
            .setFooter({ text: params.footerText });

        const descriptionChunks = chunkText(params.rollDescription);
        descriptionChunks.forEach((chunk: string, index: number) => {
            this.embed.addFields({
                name:
                    index === 0
                        ? `${this.name} rolled ${this.dicePool} dice and got __${this.successes} success${this.successes === 1 ? "" : "es"}__.`
                        : "(continued)",
                value: chunk,
                inline: false,
            });
        });
    }

    withThumbnail(url: string): this {
        this.embed.setThumbnail(url);
        return this;
    }

    build(): EmbedBuilder {
        return this.embed;
    }
}
