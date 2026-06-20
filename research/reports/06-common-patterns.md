# Top 10 Common Patterns Across Open-Source Discord.js Bots

> **Report:** Cross-repo pattern synthesis
> **Sources:** 5 open-source discord.js bots + nWoD bot current architecture
> **Date:** 2026-06-20

---

## Executive Summary

This report synthesises the 10 most common architectural patterns found across five open-source discord.js bots (totalling ~5.2k stars) and maps each to the nWoD bot's current implementation. Patterns are ranked by adoption frequency and assessed for impact if adopted.

| # | Pattern | Repos Using | nWoD Status | Priority |
|---|---------|-------------|-------------|----------|
| 1 | Filesystem-Based Command Discovery | evobot, rawon, lavamusic, ticket-bot | Manual `Commands[]` array | Medium |
| 2 | Unified Interaction Router | evobot, rawon, lavamusic, ticket-bot | Single handler (close) | Low |
| 3 | Per-Guild State Management | rawon, lavamusic, ticket-bot | In-memory + API delegation | Low |
| 4 | i18n / Localization | evobot, rawon, lavamusic, template, ticket-bot | None | Low |
| 5 | Graceful Shutdown | rawon, ticket-bot | OTel SIGTERM only | Medium |
| 6 | Cooldown / Rate Limiting | evobot, rawon, lavamusic, template | None | Medium |
| 7 | Embed Builder Pattern | All 5 | Plain objects + static methods | Medium |
| 8 | Component Interaction Handling | All 5 | `awaitMessageComponent()` loops | High |
| 9 | Config Management | All 5 | `dotenv` + `process.env` | Medium |
| 10 | Error Handling | All 5 | try/catch in interactionCreate | High |

**Priority legend:** High = addresses a current pain point or gap. Medium = would improve maintainability. Low = nice-to-have or already partially covered.

---

## Individual Repo Reports

Each pattern references the detailed architecture reports:

- **[01 -- EvoBot](01-evobot-architecture.md)** -- Singleton god object, filesystem discovery, i18n
- **[02 -- Rawon](02-rawon-architecture.md)** -- Sapphire framework, decorator guards, SQLite
- **[03 -- LavaMusic](03-lavamusic-architecture.md)** -- Build-time codegen, Drizzle ORM, component system
- **[04 -- Discord-Bot-TypeScript-Template](04-discord-bot-template-architecture.md)** -- Dual entry point, two-tier rate limiting, sharding
- **[05 -- Ticket-Bot](05-ticket-bot-architecture.md)** -- @discordjs/core, feature modules, custom ID protocol

---

## Pattern 1: Filesystem-Based Command Discovery

### Description

Instead of maintaining a hand-curated registry array, commands are discovered at runtime (or build time) by scanning a directory for files matching a naming convention. Adding a command requires only dropping a file -- no central registry edit.

### Repo Comparison

| Repo | Approach | Mechanism |
|------|----------|-----------|
| **evobot** | Runtime scan | `readdirSync` + `dynamic import()` on startup; files export a default command object |
| **rawon** | Framework auto-store | Sapphire `Store` system auto-loads from compiled `dist/`; decorators wire metadata |
| **lavamusic** | Build-time codegen | `scripts/generate-registry.ts` scans `src/commands/` and writes a generated `registry.ts` |
| **template** | Manual registration | Explicit `Command[]` array -- intentional for template clarity |
| **ticket-bot** | Runtime scan | `readdirSync` + dynamic import for `*.command.ts` files |

### nWoD Current State

`src/Commands.ts` is a manually maintained array. Every new command requires:
1. Create `src/commands/YourCommand.ts`
2. Import it in `src/Commands.ts`
3. Add it to the `Commands[]` array

The same pattern repeats for `src/AutoCompleteCommands.ts`.

### Adoption Example

Replace the manual `Commands[]` array with a filesystem scanner:

```typescript
// src/loaders/commandLoader.ts
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "../Command.js";
import { logger } from "../logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = resolve(__dirname, "../commands");

/**
 * Scans src/commands/ for files ending in Command.ts or .ts
 * (excluding helpers like AttackOptions, Attack, etc.)
 * and returns an array of Command objects.
 *
 * Convention: A command file must export a named export matching
 * the file's PascalCase name (e.g. SpellCommand.ts exports `SpellCommand`)
 * or a default export that satisfies the Command interface.
 */
export async function loadCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const files = readdirSync(COMMANDS_DIR).filter(
    (f) => f.endsWith("Command.ts") || f.endsWith("Command.js")
  );

  for (const file of files) {
    const filePath = pathToFileURL(resolve(COMMANDS_DIR, file)).href;
    try {
      const mod = await import(filePath);
      const cmd: Command | undefined = mod.default ?? mod[stem(file)];
      if (cmd && cmd.name && cmd.run) {
        commands.push(cmd);
      } else {
        logger.warn({ file }, "Command file missing name/run -- skipped");
      }
    } catch (err) {
      logger.error({ err, file }, "Failed to load command file");
    }
  }

  return commands;
}

function stem(file: string): string {
  return file.replace(/\.(ts|js)$/, "");
}
```

Then in `src/Bot.ts`:

```typescript
// Replace: import { Commands } from "./Commands.js";
// With:
import { loadCommands } from "./loaders/commandLoader.js";

const commands = await loadCommands();
ready(client, commands);
interactionCreate(client, commands);
```

Apply the same pattern to `AutoCompleteCommands` by scanning `src/autoCompleteCommands/`.

### Impact Assessment: **Medium**

- **Pros:** Eliminates the manual registry step; adding a command is a single-file change; reduces merge conflicts on `Commands.ts`.
- **Cons:** Convention must be documented; helper files (e.g. `Attack.ts`, `AttackOptions.ts`) need a naming convention to be excluded (e.g. only `*Command.ts` files); runtime scanning adds ~50ms to startup.
- **When to adopt:** When the command count exceeds ~15 or team size grows beyond 1 developer.

---

## Pattern 2: Unified Interaction Router

### Description

A single entry point that receives all `InteractionCreate` events and routes them to the correct handler based on interaction type (slash command, button, select menu, autocomplete, modal). Some frameworks add a secondary dispatch by custom ID prefix for components.

### Repo Comparison

| Repo | Approach | Routing Logic |
|------|----------|---------------|
| **evobot** | Single handler | `if (isChatInputCommand())` lookup by name in `bot.commands` Collection |
| **rawon** | Sapphire store + manual | Sapphire dispatches slash commands; manual forwarding for multi-bot voice channel interactions |
| **lavamusic** | Single handler | Routes by type: command -> `commands.get()`, button/select -> `components.get()`, autocomplete -> `commands.get().autocomplete()` |
| **template** | Handler per type | Separate `CommandHandler`, `ButtonHandler`, `TriggerHandler`, `ReactionHandler` classes |
| **ticket-bot** | InteractionRouter | Classifies by `InteractionType`, then dispatches to feature module handler maps |

### nWoD Current State

`src/listeners/interactionCreate.ts` handles slash commands and autocomplete in a single listener. There is no routing for buttons, select menus, or modals -- those are handled inline via `awaitMessageComponent()` loops within individual commands (see Pattern 8).

### Adoption Example

Extend the existing router to handle all interaction types:

```typescript
// src/listeners/interactionCreate.ts
import {
  AutocompleteInteraction,
  Client,
  CommandInteraction,
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import type { Command } from "../Command.js";
import type { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import { logger } from "../logger.js";
import { UpdateStatus } from "./UpdateStatus.js";

// Component handler registry -- keyed by customId prefix
type ComponentHandler = (
  client: Client,
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction
) => Promise<void>;

const componentHandlers = new Map<string, ComponentHandler>();

export function registerComponentHandler(prefix: string, handler: ComponentHandler) {
  componentHandlers.set(prefix, handler);
}

export default (
  client: Client,
  commands: Command[],
  autoCompleteCommands: AutoCompleteCommand[]
): void => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      UpdateStatus.startThinking(client);

      if (interaction.isCommand() || interaction.isContextMenuCommand()) {
        await handleSlashCommand(client, interaction, commands);
      } else if (interaction.isAutocomplete()) {
        await handleAutoComplete(client, interaction, autoCompleteCommands);
      } else if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isModalSubmit()
      ) {
        await handleComponent(client, interaction);
      }
    } catch (ex) {
      logger.error({ err: ex, interactionId: interaction.id }, "Error in interaction handler");
    } finally {
      UpdateStatus.doSomethingRandom(client);
    }
  });
};

async function handleComponent(
  client: Client,
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
): Promise<void> {
  // Match by customId prefix (e.g. "attack:roll", "table:page:2")
  const [prefix] = interaction.customId.split(":");
  const handler = componentHandlers.get(prefix);
  if (handler) {
    await handler(client, interaction);
  } else {
    logger.debug({ customId: interaction.customId }, "No component handler registered");
  }
}
```

### Impact Assessment: **Low**

The nWoD bot already has a single handler that covers slash commands and autocomplete. The main gap is component routing -- but that is better addressed by Pattern 8 (Component Interaction Handling). Extending the router is a small, incremental change.

---

## Pattern 3: Per-Guild State Management

### Description

Bots that serve multiple guilds need per-guild configuration (locale, prefix, feature toggles, queue state). This pattern stores that state in a database keyed by guild ID, with an in-memory cache layer.

### Repo Comparison

| Repo | Storage | Schema |
|------|---------|--------|
| **evobot** | In-memory only | `Collection<Snowflake, MusicQueue>` -- lost on crash |
| **rawon** | SQLite (better-sqlite3) | 7 tables: guilds, playlists, songs, etc. -- crash recovery |
| **lavamusic** | Drizzle ORM | 3-DB support (PostgreSQL/PGLite/SQLite), 5 tables |
| **template** | None | Intentional -- template ships without persistence |
| **ticket-bot** | Drizzle ORM + SQLite (libsql) | Ticket state, config, panels |

### nWoD Current State

The nWoD bot delegates persistence to an external REST API (`apiClient.ts`). Game data (spells, merits, rules) is loaded from static files at startup via IIFE lazy-init in data providers (`SpellProvider`, `MeritProvider`). There is no per-guild state -- the bot is guild-agnostic.

### Adoption Example

Not recommended at this time. The nWoD bot is single-guild and stateless by design -- game data lives in the API, and the bot is a thin presentation layer. If multi-guild support becomes necessary, add a lightweight config store:

```typescript
// src/data/GuildConfigProvider.ts
import { logger } from "../logger.js";

interface GuildConfig {
  guildId: string;
  locale: string;
  defaultSuccessThreshold: number;
  defaultRerollThreshold: number;
}

// In-memory cache backed by API (future)
const cache = new Map<string, GuildConfig>();

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  if (cache.has(guildId)) return cache.get(guildId)!;

  // Future: fetch from API
  const defaults: GuildConfig = {
    guildId,
    locale: "en",
    defaultSuccessThreshold: 8,
    defaultRerollThreshold: 10,
  };
  cache.set(guildId, defaults);
  return defaults;
}
```

### Impact Assessment: **Low**

The bot's current architecture (external API for persistence, static files for game data) is appropriate for its single-guild, read-heavy workload. Per-guild state is only needed if the bot expands to multi-guild deployments.

---

## Pattern 4: i18n / Localization

### Description

Externalising user-facing strings into locale files, allowing the bot to serve multiple languages. Approaches range from simple JSON files with a lookup function to full type-safe generated systems.

### Repo Comparison

| Repo | Library | Locales | Type Safety |
|------|---------|---------|-------------|
| **evobot** | `i18n` | 28 | None -- string keys |
| **rawon** | `i18n` | 14 | None -- per-guild DB locale |
| **lavamusic** | `i18next` | 30+ | Type-safe Proxy wrapper + Discord localization API |
| **template** | `linguini` | 1 | 3-tier reference system + Discord command localization |
| **ticket-bot** | `typesafe-i18n` | 1 | Generated TypeScript types from locale files |

### nWoD Current State

No i18n. All strings are inline in command files and embed builders. The bot serves English-speaking World of Darkness tabletop groups -- a niche audience where i18n is unlikely to be needed.

### Adoption Example

If i18n becomes necessary, adopt the lightweight `linguini` approach from the template (single locale, JSON-driven, Discord command localization):

```typescript
// src/i18n/index.ts
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Single-file locale -- easy to extend later
const strings: Record<string, string> = JSON.parse(
  readFileSync(resolve(__dirname, "./en.json"), "utf-8")
);

/**
 * Simple key lookup with {{placeholder}} interpolation.
 * @example t("roll.success", { name: "Alice", dice: 5, successes: 3 })
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let value = strings[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    }
  }
  return value;
}
```

```json
// src/i18n/en.json
{
  "roll.title": "{{result}} {{description}}",
  "roll.field": "{{name}} rolled {{dice}} dice and got __{{successes}} success{{plural}}__.",
  "error.command_failed": "There was an error while executing this command!",
  "error.unknown_command": "Unknown command."
}
```

### Impact Assessment: **Low**

The nWoD bot serves a niche English-speaking audience. i18n adds complexity with no current benefit. Revisit if the bot expands to non-English communities.

---

## Pattern 5: Graceful Shutdown

### Description

Handling `SIGINT`/`SIGTERM` signals to save in-flight state, flush logs, close database connections, and deregister presence before the process exits. Prevents data loss and zombie presence.

### Repo Comparison

| Repo | Signals | Actions |
|------|---------|---------|
| **evobot** | None | Relies on process manager |
| **rawon** | `SIGINT`, `SIGTERM` | Saves queue state to DB, logs shutdown, uncaughtException handler |
| **lavamusic** | None | Sharding manager handles lifecycle |
| **template** | PM2 | PM2 manages graceful restart |
| **ticket-bot** | `SIGINT`, `SIGTERM` | Wired to `client.destroy()` |

### nWoD Current State

Only the OTel SDK has a shutdown hook (`instrumentation.ts` line 141):

```typescript
process.on("SIGTERM", () => {
  sdk.shutdown().catch((err) => {
    console.error("[otel] Error during SDK shutdown:", err);
  });
});
```

The Discord client has no shutdown handler. Bot presence ("Playing nWoD") lingers until Discord times out (~60s).

### Adoption Example

Add a coordinated shutdown in `src/Bot.ts`:

```typescript
// src/Bot.ts -- after client.login(token)

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal -- cleaning up...");

  // 1. Stop accepting new interactions
  client.user?.setPresence({ status: "invisible" });

  // 2. Destroy the Discord client (closes WebSocket, clears timers)
  client.destroy();

  // 3. Flush OTel telemetry (instrumentation.ts handles sdk.shutdown())
  // Give exporters time to flush
  await new Promise((r) => setTimeout(r, 2_000));

  // 4. Flush pino logs
  logger.flush();

  logger.info("Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
```

### Impact Assessment: **Medium**

- **Pros:** Clean presence teardown; ensures OTel logs flush before exit; prevents zombie bot status in Discord.
- **Cons:** Minimal -- the bot is stateless, so no data to save.
- **When to adopt:** Low effort, high hygiene. Adopt as part of any operational hardening pass.

---

## Pattern 6: Cooldown / Rate Limiting

### Description

Preventing command abuse by enforcing per-user cooldowns. Approaches range from simple in-memory timestamps to two-tier systems (global + per-command).

### Repo Comparison

| Repo | Approach | Granularity |
|------|----------|-------------|
| **evobot** | `Collection<Snowflake, number>` per command | Per-user, per-command, with `setTimeout` cleanup |
| **rawon** | Sapphire built-in `@ApplyOptions` decorator | Per-user, per-command, framework-managed |
| **lavamusic** | In-memory `Collection` per command | Per-user, per-command |
| **template** | Two-tier: `RateLimiter` global handler + per-command `RateLimiter` | Global burst limit + per-command cooldown |
| **ticket-bot** | Not implemented | -- |

### nWoD Current State

No cooldowns. The bot has OTel metrics for Discord API rate limits (`metrics.ts` -- `rateLimitCount` counter) but no user-facing throttling.

### Adoption Example

Implement a lightweight two-tier cooldown inspired by the template:

```typescript
// src/cooldowns/CooldownManager.ts

interface CooldownEntry {
  expiresAt: number;
}

export class CooldownManager {
  /** Global: max 5 commands per 10 seconds per user */
  private globalCooldowns = new Map<string, number[]>();
  private readonly globalMax = 5;
  private readonly globalWindowMs = 10_000;

  /** Per-command: Map<commandName, Map<userId, CooldownEntry>> */
  private commandCooldowns = new Map<string, Map<string, CooldownEntry>>();

  /** Register a per-command cooldown. */
  setCooldown(commandName: string, durationMs: number): void {
    if (!this.commandCooldowns.has(commandName)) {
      this.commandCooldowns.set(commandName, new Map());
    }
    (this.commandCooldowns.get(commandName) as any)._durationMs = durationMs;
  }

  /**
   * Check if a user is allowed to run a command.
   * Returns { allowed: true } or { allowed: false, retryAfterMs }.
   */
  check(
    userId: string,
    commandName: string
  ): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();

    // -- Global check --
    const timestamps = this.globalCooldowns.get(userId) ?? [];
    const recent = timestamps.filter((t) => t > now - this.globalWindowMs);
    if (recent.length >= this.globalMax) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterMs: oldest + this.globalWindowMs - now };
    }
    recent.push(now);
    this.globalCooldowns.set(userId, recent);

    // -- Per-command check --
    const cmdMap = this.commandCooldowns.get(commandName);
    if (cmdMap) {
      const entry = cmdMap.get(userId);
      const durationMs = (cmdMap as any)._durationMs ?? 0;
      if (entry && entry.expiresAt > now) {
        return { allowed: false, retryAfterMs: entry.expiresAt - now };
      }
      cmdMap.set(userId, { expiresAt: now + durationMs });
    }

    return { allowed: true };
  }
}

export const cooldowns = new CooldownManager();

// Register per-command cooldowns
cooldowns.setCooldown("roll", 3_000);    // 3s per user
cooldowns.setCooldown("attack", 5_000);  // 5s per user
cooldowns.setCooldown("spell", 2_000);   // 2s per user
```

Then in `src/listeners/interactionCreate.ts`:

```typescript
import { cooldowns } from "../cooldowns/CooldownManager.js";

async function handleSlashCommand(
  client: Client,
  interaction: CommandInteraction,
  commands: Command[],
): Promise<void> {
  const result = cooldowns.check(interaction.user.id, interaction.commandName);
  if (!result.allowed) {
    await interaction.reply({
      content: `Slow down! Try again in ${Math.ceil(result.retryAfterMs / 1000)}s.`,
      ephemeral: true,
    });
    return;
  }
  // ... existing command dispatch
}
```

### Impact Assessment: **Medium**

- **Pros:** Prevents abuse; protects Discord API rate limits; low implementation cost.
- **Cons:** In-memory state resets on restart (acceptable for a bot this size); needs tuning per command.
- **When to adopt:** When the bot is publicly available or serves large guilds.

---

## Pattern 7: Embed Builder Pattern

### Description

How bots construct Discord embeds. Ranges from inline construction in command handlers to dedicated builder classes with template-driven rendering.

### Repo Comparison

| Repo | Approach | Example |
|------|----------|---------|
| **evobot** | Inline in command | `new EmbedBuilder().setTitle(...)` directly in `execute()` |
| **rawon** | Utility functions | `createEmbed()` helper with colour presets |
| **lavamusic** | Separate builder classes | `NowPlayingEmbed` class with `build()` method |
| **template** | Lang-driven | `EmbedBuilder.from(lang.embeds.SUCCESS)` with JSON templates |
| **ticket-bot** | Message templates | TypeScript modules with token rendering (`{{userName}}`) |

### nWoD Current State

Two patterns coexist:

1. **Static method objects** (`SpellEmbedBuilder`, `MeritEmbedBuilder`, `RuleEmbedBuilder`) -- objects with static `build*Embed()` methods that mutate an `EmbedBuilder` passed in.
2. **Standalone functions** (`RollEmbedBuilder.ts` -- `buildRollEmbed()`, `resultPresentation()`) -- pure functions returning `EmbedBuilder`.

The `SpellEmbedBuilder` pattern mutates the embed in-place:

```typescript
// Current: src/embedBuilders/SpellEmbedBuilder.ts
export const SpellEmbedBuilder = {
    buildSpellEmbed(spell: Spell, embed: EmbedBuilder) {
        embed.setTitle(spell.titleString())
        // ... mutates embed in-place
    }
}
```

### Adoption Example

Standardise on the pure-function pattern used by `RollEmbedBuilder` -- it is more testable (no mutation, returns a value):

```typescript
// src/embedBuilders/SpellEmbedBuilder.ts -- refactored
import { Spell } from "@nwod-angel/nwod-core";
import { EmbedBuilder } from "discord.js";
import { chunkText } from "./chunkText.js";

/**
 * Build an embed for a spell lookup result.
 * Pure function -- returns a new EmbedBuilder, no mutation.
 */
export function buildSpellEmbed(spell: Spell): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(spell.titleString());

  if (spell.requirements?.length > 0) {
    embed.addFields({ name: "Requirements", value: spell.requirementsString(), inline: false });
  }

  embed.addFields(
    { name: "Practice", value: spell.practiceString(), inline: true },
    { name: "Action", value: spell.action, inline: true },
    { name: "Duration", value: spell.duration, inline: true },
    { name: "Aspect", value: spell.aspect, inline: true },
    { name: "Cost", value: spell.cost, inline: true },
  );

  const descriptionChunks = chunkText(spell.description);
  descriptionChunks.forEach((chunk: string, index: number) => {
    embed.addFields({
      name: `Effect (${index + 1}/${descriptionChunks.length})`,
      value: chunk,
      inline: false,
    });
  });

  embed.addFields({ name: "Sources", value: spell.sourcesString(), inline: false });

  return embed;
}
```

Usage in command:

```typescript
// Before:
const embed = new EmbedBuilder();
SpellEmbedBuilder.buildSpellEmbed(spell, embed);

// After:
const embed = buildSpellEmbed(spell);
```

### Impact Assessment: **Medium**

- **Pros:** Pure functions are easier to test (input -> output); consistent API across all embed builders; no hidden mutation.
- **Cons:** Requires refactoring `SpellEmbedBuilder`, `MeritEmbedBuilder`, `RuleEmbedBuilder` -- ~3 files, low effort.
- **When to adopt:** Incrementally -- convert one builder at a time during regular development.

---

## Pattern 8: Component Interaction Handling

### Description

How bots handle button clicks, select menu selections, and modal submissions. This is the most architecturally significant pattern -- it determines whether interactive features (multi-step workflows, pagination, confirmation dialogs) are maintainable or spaghetti.

### Repo Comparison

| Repo | Approach | Architecture |
|------|----------|--------------|
| **evobot** | Button collectors in `MusicQueue` | `createMessageComponentCollector()` with filter; delegates to slash command `execute()` |
| **rawon** | InteractionCreate listener dispatches | Sapphire listener checks `isButton()` and routes by custom ID |
| **lavamusic** | Component registry | `Collection<string, Component>` with `type` + `customId` + `run()` interface |
| **template** | ButtonHandler | `Button[]` interface with `ButtonCustomIds` enum; separate handler class |
| **ticket-bot** | FeatureModule flat handler maps | `buttonHandlers: Record<string, handler>` + custom ID protocol (`action:target:id`) |

### nWoD Current State

The `AttackCommand` uses `awaitMessageComponent()` in a `while` loop:

```typescript
// src/commands/AttackCommand.ts (lines 162-204)
while (!readyToRoll && !cancelling) {
    let response = await message.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
    });

    if (response.customId === 'cancel') {
        cancelling = true;
        // ...
    } else if (response.customId === 'roll') {
        readyToRoll = true;
        roll(interaction, embed, attack);
    } else {
        let attackOption = attackOptions.find(ao => ao.option === response.customId);
        attackOption?.action(embed, attack);
        // ...
    }
}
```

This pattern has several problems:
- **Blocks the command handler** -- the `while` loop ties up the async stack for the entire interaction lifetime (up to 60s).
- **Not resilient to restarts** -- if the bot restarts mid-workflow, the interaction is lost.
- **Duplicated logic** -- each command that needs buttons reimplements the collector loop.
- **No central routing** -- button interactions bypass the main `interactionCreate` handler entirely.

### Adoption Example

Extract button handling into a component registry, following lavamusic's pattern:

```typescript
// src/components/ComponentRegistry.ts
import { Client, ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import { logger } from "../logger.js";

export interface Component {
  /** Prefix of the customId (e.g. "attack", "table") */
  prefix: string;
  /** Handle a component interaction */
  run: (client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) => Promise<void>;
}

export class ComponentRegistry {
  private handlers = new Map<string, Component>();

  register(component: Component): void {
    this.handlers.set(component.prefix, component);
  }

  /**
   * Route a component interaction to its handler by customId prefix.
   * CustomId protocol: "prefix:action:key" (e.g. "attack:option:all-out")
   */
  async handle(
    client: Client,
    interaction: ButtonInteraction | StringSelectMenuInteraction,
  ): Promise<void> {
    const [prefix] = interaction.customId.split(":");
    const component = this.handlers.get(prefix);
    if (!component) {
      logger.debug({ customId: interaction.customId }, "No component handler for prefix");
      return;
    }
    await component.run(client, interaction);
  }
}

export const componentRegistry = new ComponentRegistry();
```

Register the AttackCommand's buttons:

```typescript
// src/components/AttackComponent.ts
import type { Component } from "./ComponentRegistry.js";
import { componentRegistry } from "./ComponentRegistry.js";

const attackComponent: Component = {
  prefix: "attack",
  run: async (client, interaction) => {
    const [, action, key] = interaction.customId.split(":");

    if (action === "roll") {
      // Delegate to roll logic
      await handleAttackRoll(interaction);
    } else if (action === "cancel") {
      await interaction.update({ content: "Cancelled.", embeds: [], components: [] });
    } else if (action === "option") {
      // Apply the attack option identified by key
      await handleAttackOption(interaction, key);
    }
  },
};

componentRegistry.register(attackComponent);
```

Wire the router in `interactionCreate.ts`:

```typescript
// In handleComponent() from Pattern 2:
import { componentRegistry } from "../components/ComponentRegistry.js";

async function handleComponent(
  client: Client,
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
): Promise<void> {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await componentRegistry.handle(client, interaction);
  }
}
```

Then refactor `AttackCommand.ts` to use `interaction.editReply({ components })` instead of the `awaitMessageComponent()` loop. The command sends the initial message with buttons and returns immediately; button clicks are routed through the component registry.

### Impact Assessment: **High**

- **Pros:** Eliminates blocking `while` loops; centralises component routing; each command's interactive logic becomes a standalone module; testable in isolation.
- **Cons:** Requires refactoring `AttackCommand.ts` (the only command using buttons today); introduces a new abstraction layer.
- **When to adopt:** Now -- the `AttackCommand` is the most complex command and the `awaitMessageComponent()` loop is the biggest architectural smell in the codebase.

---

## Pattern 9: Config Management

### Description

How bots load, validate, and access configuration (tokens, API URLs, feature flags). Approaches range from raw env vars to validated config objects with runtime type checking.

### Repo Comparison

| Repo | Approach | Validation |
|------|----------|------------|
| **evobot** | `config.json` + env fallback (`dotenv`) | None -- missing keys cause runtime errors |
| **rawon** | `env.ts` parsing | Manual parsing with defaults |
| **lavamusic** | Zod-validated env vars | Runtime validation with typed errors on startup |
| **template** | Three JSON files (`config/debug/bot-sites`) | Schema validation at load time |
| **ticket-bot** | `defineConfig()` with versioning | Structured config object with defaults |

### nWoD Current State

Config is loaded via `dotenv` in `Bot.ts` (line 1-2) and read lazily via `process.env["KEY"]` throughout the codebase:

```typescript
// Bot.ts
import * as dotenv from 'dotenv'
dotenv.config();

// apiClient.ts -- lazy reads
function getApiBaseUrl(): string {
  return (process.env["API_BASE_URL"] || "http://localhost:3001").replace(/\/+$/, "");
}
```

There is one validation function (`validateApiConfig()` in `apiClient.ts`) that warns if `API_BASE_URL` is missing. No validation for `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, etc.

### Adoption Example

Add Zod-validated config, following lavamusic's approach:

```typescript
// src/config.ts
import { z } from "zod";
import { logger } from "./logger.js";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_LOGGING_CHANNEL_ID: z.string().optional(),
  DISCORD_FEEDBACK_CHANNEL_ID: z.string().optional(),
  API_BASE_URL: z.string().url().default("http://localhost:3001"),
  USE_API_ROLL: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type Config = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables.
 * Call once at startup after dotenv.config().
 * Throws with clear messages on validation failure.
 */
export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    logger.error(`Environment validation failed:\n${errors}`);
    process.exit(1);
  }
  return result.data;
}
```

Then in `src/Bot.ts`:

```typescript
import * as dotenv from "dotenv";
dotenv.config();

import { loadConfig } from "./config.js";
const config = loadConfig(); // Fails fast with clear error messages

// Use config.DISCORD_TOKEN instead of process.env["DISCORD_TOKEN"]
client.login(config.DISCORD_TOKEN);
```

### Impact Assessment: **Medium**

- **Pros:** Fails fast with clear error messages on misconfiguration; typed config object eliminates `process.env["KEY"]` scattered throughout codebase; documents all required/optional env vars in one place.
- **Cons:** Adds `zod` dependency (~120KB); requires migrating all `process.env` reads to `config.*`.
- **When to adopt:** When the number of env vars exceeds ~8 or when onboarding new developers.

---

## Pattern 10: Error Handling

### Description

How bots catch, classify, report, and recover from errors. Approaches range from ad-hoc try/catch to structured error hierarchies with user-facing messages and operator alerts.

### Repo Comparison

| Repo | Approach | User Feedback |
|------|----------|---------------|
| **evobot** | Ad-hoc try/catch + `.catch(console.error)` | Generic "An error occurred" |
| **rawon** | Listeners log errors | Silent to user |
| **lavamusic** | Convention-based validation | Validation errors shown to user |
| **template** | `InteractionUtils` silences expected errors | Only unexpected errors surface |
| **ticket-bot** | Graceful degradation with timeouts | Timeout messages with retry guidance |

### nWoD Current State

The main error handling lives in `src/listeners/interactionCreate.ts`:

```typescript
// Outer catch -- catches errors from UpdateStatus
try {
    UpdateStatus.startThinking(client)
    if (interaction.isCommand() || ...) {
        await handleSlashCommand(client, interaction);
    } else if (interaction.isAutocomplete()) {
        await handleAutoCompleteCommand(client, interaction);
    }
    UpdateStatus.doSomethingRandom(client)
} catch (ex) {
    logger.error({ err: ex }, 'Errored during interaction handler.')
}

// Inner catch -- catches errors from command execution
try {
    await interaction.deferReply();
    slashCommand.run(client, interaction);
} catch (ex) {
    logger.error({ err: ex }, 'Errored handling slash command.')
    await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
    });
}
```

Problems:
- **Generic error message** -- "There was an error while executing this command!" gives users no useful information.
- **Silent autocomplete failures** -- autocomplete errors are caught by the outer handler and logged, but the user sees no response.
- **No error classification** -- network errors, validation errors, and bugs all get the same treatment.
- **`slashCommand.run()` is not awaited** -- the inner `try` block does not `await` the result, so promise rejections may not be caught.

### Adoption Example

Add structured error handling with user-friendly messages:

```typescript
// src/errors/AppError.ts

/** Base error class for expected, user-facing errors. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Data lookup returned no results. */
export class NotFoundError extends AppError {
  constructor(entity: string, query: string) {
    super(
      `${entity} not found: ${query}`,
      `No ${entity.toLowerCase()} found matching "${query}".`,
    );
    this.name = "NotFoundError";
  }
}

/** External API call failed. */
export class ApiError extends AppError {
  constructor(message: string, status?: number) {
    super(
      `API error (${status}): ${message}`,
      "The game server is temporarily unavailable. Please try again in a moment.",
      true,
    );
    this.name = "ApiError";
  }
}
```

Update the interaction handler:

```typescript
// src/listeners/interactionCreate.ts
import { AppError } from "../errors/AppError.js";

async function handleSlashCommand(
  client: Client,
  interaction: CommandInteraction,
  commands: Command[],
): Promise<void> {
  const slashCommand = commands.find((c) => c.name === interaction.commandName);
  if (!slashCommand) {
    logger.warn({ commandName: interaction.commandName }, "Unknown command");
    await interaction.reply({ content: "Unknown command.", ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply();
    await slashCommand.run(client, interaction); // <-- await the result
  } catch (err) {
    // Log with full context
    logger.error(
      { err, command: interaction.commandName, userId: interaction.user.id },
      "Command failed"
    );

    // Classify and respond
    const userMessage = err instanceof AppError
      ? err.userMessage
      : "Something went wrong. Please try again later.";

    try {
      await interaction.followUp({ content: userMessage, ephemeral: true });
    } catch {
      // Interaction may have already been responded to
      logger.debug("Could not send error follow-up -- interaction may be expired");
    }
  }
}
```

### Impact Assessment: **High**

- **Pros:** Users get actionable error messages; operators get structured logs with context; error classification enables different handling (retry network errors, show validation errors, alert on bugs).
- **Cons:** Requires defining an error hierarchy; each command should throw typed errors instead of generic `Error`.
- **When to adopt:** Now -- the generic "There was an error" message is the single biggest UX improvement available with minimal effort.

---

## Adoption Roadmap

Based on priority and dependencies, here is the recommended adoption order:

### Phase 1: Quick Wins (no new dependencies)

1. **Pattern 10 -- Error Handling** -- Replace generic error messages with structured `AppError` hierarchy. Highest UX impact, lowest effort.
2. **Pattern 7 -- Embed Builder Pattern** -- Standardise on pure-function builders. Incremental refactor during regular development.
3. **Pattern 5 -- Graceful Shutdown** -- Add `SIGINT`/`SIGTERM` handlers. 10 lines of code in `Bot.ts`.

### Phase 2: Structural Improvements

4. **Pattern 8 -- Component Interaction Handling** -- Extract `AttackCommand` button logic into a component registry. Eliminates the `awaitMessageComponent()` loop.
5. **Pattern 9 -- Config Management** -- Add Zod-validated config. Fails fast, documents env vars.
6. **Pattern 6 -- Cooldown / Rate Limiting** -- Add per-command cooldowns. Protects against abuse.

### Phase 3: Scale Prerequisites

7. **Pattern 1 -- Filesystem-Based Command Discovery** -- Adopt when command count exceeds ~15 or team grows.
8. **Pattern 2 -- Unified Interaction Router** -- Naturally follows from Pattern 8.

### Not Recommended

- **Pattern 3 -- Per-Guild State Management** -- Not needed for single-guild, stateless bot.
- **Pattern 4 -- i18n / Localization** -- Not needed for niche English-speaking audience.

---

## Appendix: nWoD Bot Architecture Summary

For reference, here is the current nWoD bot architecture that each pattern maps to:

| Aspect | Current Implementation |
|--------|----------------------|
| Entry point | `src/Bot.ts` -- dotenv, Client (no intents), register listeners |
| Command registry | `src/Commands.ts` -- manual `Command[]` array |
| Command interface | `src/Command.ts` -- `ChatInputApplicationCommandData + run` |
| Interaction handler | `src/listeners/interactionCreate.ts` -- single handler, lookup by name |
| Autocomplete | `src/AutoCompleteCommands.ts` -- separate manual registry |
| Data providers | `src/data/*Provider.ts` -- static classes with IIFE lazy-init |
| Embed builders | `src/embedBuilders/` -- mix of static-method objects and pure functions |
| Component handling | Inline `awaitMessageComponent()` loops in commands |
| API client | `src/apiClient.ts` -- native fetch with retry for post, fail-gracefully for reads |
| Observability | Pino + OpenTelemetry (Honeycomb) -- traces, logs, metrics |
| Config | `dotenv` + `process.env` lazy reads |
| Error handling | try/catch in interactionCreate, generic user message |
| Testing | Vitest with ~80% coverage |
| Build | ESM (`"type": "module"`), TypeScript strict mode |
