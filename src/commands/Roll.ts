import {
  EmbedBuilder,
  Client,
  ApplicationCommandType,
  CommandInteraction,
  ColorResolvable,
  Colors,
} from "discord.js";
import { Command } from "../Command.js";
import DiscordChannelLogger from "../DiscordChannelLogger.js";
import {
  rollViaApi,
  USE_API_ROLL,
  RollApiResponse,
} from "../apiClient.js";

// ── Embed helpers (shared by API and direct paths) ─────────────

/**
 * Map a RollResult code to a display label and Discord colour.
 */
function resultPresentation(
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
function buildRollEmbed(params: {
  actionResult: string;
  description: string;
  name: string;
  dicePool: number;
  successes: number;
  rollDescription: string;
  colour: ColorResolvable;
  footerText: string;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle([params.actionResult, params.description].join(" "))
    .setColor(params.colour)
    .setFooter({ text: params.footerText });

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

// ── Command ────────────────────────────────────────────────────

export const Roll: Command = {
  name: "roll",
  description: "Rolls dice",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "dice-pool",
      description: "This number of dice will be rolled",
      type: 4, // Integer
      required: true,
      minValue: 0,
    },
    {
      name: "name",
      description: "The name of the entity rolling [optional]",
      type: 3, // String
    },
    {
      name: "description",
      description: "The description of the roll [optional]",
      type: 3, // String
    },
    {
      name: "success-threshold",
      description: "The lowest number on the die representing a success (default: 8)",
      type: 4, // Integer
    },
    {
      name: "reroll-threshold",
      description: "The lowest number on the die representing a reroll (default: 10)",
      type: 4, // Integer
    },
    {
      name: "extended-rolls",
      description: "If defined the roll will be extended and rolled this many times",
      type: 4, // Integer
    },
    {
      name: "target",
      description: "If defined an extended roll will stop after this many successes [optional]",
      type: 4, // Integer
    },
    {
      name: "rote",
      description: "Rote actions re-roll failures once (default: false)",
      type: 5, // Boolean
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    DiscordChannelLogger.setClient(client).logBaggage({
      interaction: interaction,
      options: interaction.options,
    });

    // ── Parse common options ───────────────────────────────────

    const dicePool = Number(interaction.options.get("dice-pool")!.value);

    let name = interaction.member?.user.username ?? "Unknown";
    if (interaction.options.get("name")) {
      name = `*${interaction.options.get("name")!.value?.toString()!}*`;
    }

    let description = "";
    if (interaction.options.get("description")) {
      description = `*${interaction.options.get("description")!.value?.toString()!}*`;
    }

    let successThreshold: number | undefined;
    if (interaction.options.get("success-threshold")) {
      successThreshold = Number(
        interaction.options.get("success-threshold")!.value,
      );
    }

    let rerollThreshold: number | undefined;
    if (interaction.options.get("reroll-threshold")) {
      rerollThreshold = Number(
        interaction.options.get("reroll-threshold")!.value,
      );
    }

    let extendedRolls: number | undefined;
    if (interaction.options.get("extended-rolls")) {
      extendedRolls = Number(interaction.options.get("extended-rolls")!.value);
    }

    let target: number | undefined;
    if (interaction.options.get("target")) {
      target = Number(interaction.options.get("target")!.value);
    }

    let rote = false;
    if (interaction.options.get("rote")) {
      rote = Boolean(interaction.options.get("rote")!.value);
    }

    // ── Try API path (when feature flag is on) ─────────────────

    if (USE_API_ROLL) {
      try {
        const apiResult = await rollViaApi({
          dicePool,
          userId: interaction.user.id,
          characterName: name,
          description,
          successThreshold,
          rerollThreshold,
          rote,
          extendedRolls,
          target,
          interactionId: interaction.id,
          guildId: interaction.guildId || undefined,
        });

        const { label, colour } = resultPresentation(apiResult.resultCode);
        const embed = buildRollEmbed({
          actionResult: label,
          description,
          name: apiResult.characterName || name,
          dicePool: apiResult.dicePool,
          successes: apiResult.successes,
          rollDescription: apiResult.rollDescription,
          colour,
          footerText: interaction.id,
        });

        await interaction.followUp({ embeds: [embed] });
        DiscordChannelLogger.setClient(client).logBaggage({
          interaction: interaction,
          embed: embed,
          apiResult,
        });

        // API handled persistence — nothing more to do
        return;
      } catch (apiErr) {
        console.error("API roll failed, falling back to direct roll:", apiErr);
        // Fall through to direct path below
      }
    }

    // ── Direct path (fallback or USE_API_ROLL not set) ─────────

    // Lazy-import roller library only when needed (avoids loading
    // the ESM module on every command invocation if API is preferred)
    const { InstantRoll, ExtendedRoll, RollResult } = await (async () => {
      const mod = await import("@nwod-angel/nwod-roller");
      return mod as {
        InstantRoll: new (opts: any) => any;
        ExtendedRoll: new (opts: any) => any;
        RollResult: { critical_failure: number; failure: number; success: number; exceptional_success: number };
      };
    })();

    const action = extendedRolls !== undefined ? "extended" : "instant";

    let rollDescription = "";
    let result: number;
    let successes: number;

    switch (action) {
      case "instant": {
        const instantRoll = new InstantRoll({
          dicePool,
          rote,
          successThreshold,
          rerollThreshold,
        });
        rollDescription = instantRoll.toString();
        successes = instantRoll.numberOfSuccesses();
        result = instantRoll.result() as number;
        break;
      }
      case "extended": {
        const extendedRoll = new ExtendedRoll({
          dicePool,
          rote,
          successThreshold,
          rerollThreshold,
          extendedRolls,
          target,
        });
        rollDescription = extendedRoll.toString();
        successes = extendedRoll.numberOfSuccesses();
        result = extendedRoll.result() as number;
        break;
      }
    }

    const { label, colour } = resultPresentation(result);
    const embed = buildRollEmbed({
      actionResult: label,
      description,
      name,
      dicePool,
      successes,
      rollDescription,
      colour,
      footerText: interaction.id,
    });

    await interaction.followUp({ embeds: [embed] });
    DiscordChannelLogger.setClient(client).logBaggage({
      interaction: interaction,
      embed: embed,
    });
  },
};
