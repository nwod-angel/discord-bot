import {
  EmbedBuilder,
  ColorResolvable,
  Colors,
} from "discord.js";

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
 * Build the roll embed from common result data.
 */
export function buildRollEmbed(params: {
  actionResult: string;
  description: string;
  name: string;
  dicePool: number;
  successes: number;
  rollDescription: string;
  colour: ColorResolvable;
  footerText: string;
  thumbnailUrl?: string;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle([params.actionResult, params.description].join(" "))
    .setColor(params.colour)
    .setFooter({ text: params.footerText });

  if (params.thumbnailUrl) {
    embed.setThumbnail(params.thumbnailUrl);
  }

  const descriptionChunks =
    params.rollDescription.match(
      /(?:(?:.){1,1000}(?:$|\n)|(?:.){1,1000}(?: |$|\n))/sgm,
    ) || [];

  descriptionChunks.forEach((chunk: string, index: number) => {
    embed.addFields({
      name:
        index === 0
          ? `${params.name} rolled ${params.dicePool} dice and got __${params.successes} success${params.successes === 1 ? "" : "es"}__.`
          : "(continued)",
      value: chunk,
      inline: false,
    });
  });

  return embed;
}
