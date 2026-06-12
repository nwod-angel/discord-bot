import {
  EmbedBuilder,
  Client,
  ApplicationCommandType,
  CommandInteraction,
  ColorResolvable,
  Colors,
} from "discord.js";
import { Command } from "../Command.js";
import { logger } from "../logger.js";
import {
  rollViaApi,
  USE_API_ROLL,
  RollApiResponse,
  fetchCharacterPortraits,
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
      autocomplete: true,
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
    {
      name: "use-willpower",
      description: "Spend 1 willpower for +3 dice (default: false)",
      type: 5, // Boolean
    },
  ],
  run: async (client: Client, interaction: CommandInteraction) => {
    logger.info({
      user_id: interaction.user.id,
      guild_id: interaction.guildId,
      endpoint: '/roll',
      interaction_id: interaction.id,
      options: {
        dice_pool: interaction.options.get('dice-pool')?.value,
        name: interaction.options.get('name')?.value,
        description: interaction.options.get('description')?.value,
        success_threshold: interaction.options.get('success-threshold')?.value,
        reroll_threshold: interaction.options.get('reroll-threshold')?.value,
        extended_rolls: interaction.options.get('extended-rolls')?.value,
        target: interaction.options.get('target')?.value,
        rote: interaction.options.get('rote')?.value,
        use_willpower: interaction.options.get('use-willpower')?.value,
      },
    }, '/roll command invoked');

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

    let useWillpower = false;
    if (interaction.options.get("use-willpower")) {
      useWillpower = Boolean(interaction.options.get("use-willpower")!.value);
    }

    // ── Willpower bonus ───────────────────────────────────────
    // Spending 1 willpower grants +3 dice to a single roll.
    let willpowerApplied = false;
    if (useWillpower) {
      willpowerApplied = true;
    }

    const finalDicePool = dicePool + (willpowerApplied ? 3 : 0);
    if (willpowerApplied) {
      const wpSuffix = " (Spending Willpower +3)";
      description = description ? description + wpSuffix : wpSuffix.trim();
    }

    // ── Try API path (when feature flag is on) ─────────────────

    if (USE_API_ROLL) {
      const rollStart = performance.now();
      try {
        const apiResult = await rollViaApi({
          dicePool: finalDicePool,
          userId: interaction.user.id,
          characterName: name,
          description,
          successThreshold,
          rerollThreshold,
          rote,
          extendedRolls,
          target,
          interactionId: interaction.id,
          channelId: interaction.channelId,
          guildId: interaction.guildId || undefined,
        });

        const elapsedMs = Math.round(performance.now() - rollStart);
        const { label, colour } = resultPresentation(apiResult.resultCode);

        const embed = buildRollEmbed({
          actionResult: label,
          description,
          name: apiResult.characterName || name,
          dicePool: apiResult.dicePool,
          successes: apiResult.successes,
          rollDescription: apiResult.rollDescription,
          colour,
          footerText: apiResult.id
            ? `roll-${apiResult.id} · ${elapsedMs}ms`
            : `${interaction.id} · ${elapsedMs}ms`,
          thumbnailUrl: apiResult.characterPortrait,
        });

        await interaction.followUp({ embeds: [embed] });
        logger.debug({
          user_id: interaction.user.id,
          guild_id: interaction.guildId,
          endpoint: '/roll',
          interaction_id: interaction.id,
          api_result: {
            id: apiResult.id,
            dice_pool: apiResult.dicePool,
            successes: apiResult.successes,
            result: apiResult.result,
            posted_to_discord: apiResult.postedToDiscord,
          },
          elapsed_ms: elapsedMs,
        }, '/roll API path succeeded');

        // API handled persistence — nothing more to do
        return;
      } catch (apiErr) {
        logger.error({ err: apiErr }, "API roll failed, falling back to direct roll");
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
          dicePool: finalDicePool,
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
          dicePool: finalDicePool,
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

    // ── Character portrait lookup (direct path) ───────────────────
    let thumbnailUrl: string | undefined;
    const cleanName = name.replace(/^\*+|\*+$/g, "").trim();
    if (cleanName && cleanName !== interaction.member?.user.username) {
      try {
        const portraits = await fetchCharacterPortraits(interaction.user.id);
        const match = portraits.find((p) => p.name === cleanName);
        if (match?.portrait) {
          thumbnailUrl = match.portrait;
        }
      } catch {
        // Graceful degradation — thumbnails are optional
      }
    }

    const { label, colour } = resultPresentation(result);
    const embed = buildRollEmbed({
      actionResult: label,
      description,
      name,
      dicePool: finalDicePool,
      successes,
      rollDescription,
      colour,
      footerText: interaction.id,
      thumbnailUrl,
    });

    await interaction.followUp({ embeds: [embed] });
    logger.debug({
      user_id: interaction.user.id,
      guild_id: interaction.guildId,
      endpoint: '/roll',
      interaction_id: interaction.id,
      dice_pool: finalDicePool,
      successes,
      result,
    }, '/roll direct path succeeded');
  },
};
