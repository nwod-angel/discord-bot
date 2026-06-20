# nWoD Discord Bot — Incremental Implementation Plan

> **Date:** 2026-06-20
> **Scope:** Incremental improvements to the existing nWoD discord-bot, informed by analysis of 5 open-source discord.js bots (EvoBot, Rawon, LavaMusic, Discord-Bot-TypeScript-Template, Ticket-Bot) and the current nWoD bot architecture.
> **Approach:** Three-phase incremental evolution — not a full rewrite.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Architecture Summary](#current-architecture-summary)
- [Phase A: Immediate (Low Risk, High Impact)](#phase-a-immediate-low-risk-high-impact)
  - [A1. Filesystem Command Discovery](#a1-filesystem-command-discovery)
  - [A2. Graceful Shutdown](#a2-graceful-shutdown)
  - [A3. Per-Command Cooldowns](#a3-per-command-cooldowns)
- [Phase B: Near-Term (Medium Risk, High Impact)](#phase-b-near-term-medium-risk-high-impact)
  - [B1. Component Registry for Button/Select Handlers](#b1-component-registry-for-buttonselect-handlers)
  - [B2. i18n Support](#b2-i18n-support)
  - [B3. Zod Environment Validation](#b3-zod-environment-validation)
- [Phase C: Future (Higher Risk, Medium Impact)](#phase-c-future-higher-risk-medium-impact)
  - [C1. Two-Tier Rate Limiting](#c1-two-tier-rate-limiting)
  - [C2. Unified Error Classification](#c2-unified-error-classification)
  - [C3. Embed Builder Refactor](#c3-embed-builder-refactor)
- [Dependency Graph](#dependency-graph)
- [Phase Timeline Estimates](#phase-timeline-estimates)
- [Rollback Strategy](#rollback-strategy)
- [Success Criteria](#success-criteria)

---

## Executive Summary

This plan proposes **9 incremental improvements** across 3 phases. Each item is independently deployable and backward-compatible. The plan prioritizes low-risk, high-impact changes first (Phase A) and defers higher-risk work to later phases.

**Key principles:**
- No full rewrite — every change is additive or a targeted refactor
- Each item can be rolled back independently
- Existing tests must continue to pass throughout
- New functionality requires new tests

| Phase | Items | Risk | Impact | Estimated Effort |
|-------|-------|------|--------|-----------------|
| **A: Immediate** | A1, A2, A3 | Low | High | 1–2 days |
| **B: Near-Term** | B1, B2, B3 | Medium | High | 3–5 days |
| **C: Future** | C1, C2, C3 | Low–Medium | Medium | 2–3 days |

---

## Current Architecture Summary

```
src/
├── Bot.ts                      # Entry: dotenv → OTel → Client({ intents: [] }) → login
├── Command.ts                  # Interface: ChatInputApplicationCommandData + run()
├── Commands.ts                 # Manual registry: Commands[] array (11 imports)
├── AutoCompleteCommand.ts      # Interface: name + autocomplete()
├── AutoCompleteCommands.ts     # Manual registry: AutoCompleteCommands[] array (6 imports)
├── apiClient.ts                # Native fetch + retry, PostError discriminated type
├── logger.ts                   # Pino + OTel bridge to Honeycomb
├── instrumentation.ts          # OpenTelemetry SDK setup
├── metrics.ts                  # OTel meter definitions
├── listeners/
│   ├── interactionCreate.ts    # Routes commands + autocomplete by name
│   ├── ready.ts                # Registers Commands with Discord API
│   ├── unhandledRejection.ts   # Logs unhandled rejections
│   ├── unhandledException.ts   # Logs unhandled exceptions
│   └── UpdateStatus.ts         # Bot status rotation
├── commands/                   # 11 slash commands (one file each)
│   ├── Hello.ts, Goodbye.ts, Roll.ts, Post.ts
│   ├── SpellCommand.ts, MeritCommand.ts, RuleCommand.ts, TableCommand.ts
│   ├── ParadoxCommand.ts, CastCommand.ts, AttackCommand.ts
│   └── Attack*.ts              # Supporting attack types/options/builders
├── autoCompleteCommands/       # 6 autocomplete handlers
├── data/                       # Static game data providers (IIFE lazy init)
├── embedBuilders/              # EmbedBuilder helpers (static methods)
└── __tests__/                  # Vitest tests, 80% coverage threshold
```

**Key characteristics:**
- ESM with `.js` import extensions, `moduleResolution: bundler`
- No intents needed (slash commands only, no message content)
- Data providers use static classes with IIFE lazy initialization
- Interactive commands (`/attack`, `/paradox`) use `awaitMessageComponent()` loops
- `PostError` discriminated error class in `apiClient.ts` — existing error classification pattern

---

## Phase A: Immediate (Low Risk, High Impact)

### A1. Filesystem Command Discovery

**Sources:** EvoBot (Section 5), LavaMusic (Section 4), Ticket-Bot (Section 2)

#### Problem Statement

Every new command requires:
1. Create the command file in `src/commands/`
2. Import it in `src/Commands.ts`
3. Add it to the `Commands[]` array
4. Repeat steps 2–3 for `src/AutoCompleteCommands.ts` if the command has autocomplete

This is error-prone (forgetting step 2/3 silently breaks registration) and adds boilerplate that grows linearly with command count.

#### Solution

Replace the manual `Commands[]` and `AutoCompleteCommands[]` arrays with filesystem-based auto-discovery. A `loadCommands()` utility scans `src/commands/` and `src/autoCompleteCommands/` at startup, dynamically imports each file, validates the export shape, and returns the registry arrays.

#### Before Code

```typescript
// src/Commands.ts (current)
import { Command } from "./Command.js";
import { Hello } from "./commands/Hello.js";
import { Roll } from "./commands/Roll.js";
import { Goodbye } from "./commands/Goodbye.js";
import { SpellCommand } from "./commands/SpellCommand.js";
import { MeritCommand } from "./commands/MeritCommand.js";
import { RuleCommand } from "./commands/RuleCommand.js";
import { TableCommand } from "./commands/TableCommand.js";
import { ParadoxCommand } from "./commands/ParadoxCommand.js";
import { CastCommand } from "./commands/CastCommand.js";
import { AttackCommand } from "./commands/AttackCommand.js";
import { Post } from "./commands/Post.js";

export const Commands: Command[] = [
    Hello,
    Roll,
    Goodbye,
    SpellCommand,
    MeritCommand,
    RuleCommand,
    TableCommand,
    ParadoxCommand,
    CastCommand,
    AttackCommand,
    Post,
];
```

```typescript
// src/AutoCompleteCommands.ts (current)
import { AutoCompleteCommand } from "./AutoCompleteCommand.js";
import { MeritAutocomplete } from "./autoCompleteCommands/MeritAutoComplete.js";
import { RollAutocomplete } from "./autoCompleteCommands/RollAutocomplete.js";
import { RuleAutocomplete } from "./autoCompleteCommands/RuleAutocomplete.js";
import { SpellAutocomplete } from "./autoCompleteCommands/SpellAutocomplete.js";
import { TableAutocomplete } from "./autoCompleteCommands/TableAutocomplete.js";
import { PostAutocomplete } from "./autoCompleteCommands/PostAutocomplete.js";

export const AutoCompleteCommands: AutoCompleteCommand[] = [
    SpellAutocomplete,
    MeritAutocomplete,
    RuleAutocomplete,
    TableAutocomplete,
    RollAutocomplete,
    PostAutocomplete,
];
```

#### After Code

```typescript
// src/utils/loadCommands.ts (new file)
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { logger } from "../logger.js";

/** Files to skip during discovery. */
const IGNORED_PATTERNS = [".test.ts", ".test.js", ".d.ts", ".d.js", ".map"];

/**
 * Scan a directory for TypeScript/JavaScript modules and return their
 * default or first named export, filtered by a validation predicate.
 *
 * This pattern is adapted from EvoBot's filesystem discovery and
 * LavaMusic's build-time registry — but runs at startup (no build step).
 */
export async function discoverModules<T>(
  dir: string,
  validate: (mod: unknown) => mod is T,
  label: string,
): Promise<T[]> {
  const results: T[] = [];
  let entries: string[];

  try {
    entries = await readdir(dir);
  } catch (err) {
    logger.warn({ err, dir }, `[loadCommands] Could not read ${label} directory`);
    return results;
  }

  for (const file of entries) {
    // Skip non-source files
    if (IGNORED_PATTERNS.some(p => file.endsWith(p))) continue;
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

    const fullPath = join(dir, file);
    try {
      const fileUrl = pathToFileURL(fullPath).href;
      const mod = await import(fileUrl);
      // Support both default exports and named exports
      const exported = mod.default ?? mod[Object.keys(mod).find(k => k !== "__esModule") ?? ""];

      if (validate(exported)) {
        results.push(exported);
        logger.debug({ file, name: (exported as any).name }, `[loadCommands] Loaded ${label}`);
      } else {
        logger.warn({ file }, `[loadCommands] Skipping ${file} — does not match ${label} interface`);
      }
    } catch (err) {
      logger.error({ err, file }, `[loadCommands] Failed to import ${file}`);
    }
  }

  return results;
}
```

```typescript
// src/Commands.ts (after — becomes a thin re-export)
import { Command } from "./Command.js";
import { discoverModules } from "./utils/loadCommands.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function isCommand(mod: unknown): mod is Command {
  return (
    typeof mod === "object" &&
    mod !== null &&
    "name" in mod &&
    "run" in mod &&
    typeof (mod as Command).run === "function"
  );
}

export const Commands: Command[] = await discoverModules(
  join(__dirname, "commands"),
  isCommand,
  "command",
);
```

```typescript
// src/AutoCompleteCommands.ts (after — same pattern)
import { AutoCompleteCommand } from "./AutoCompleteCommand.js";
import { discoverModules } from "./utils/loadCommands.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function isAutoCompleteCommand(mod: unknown): mod is AutoCompleteCommand {
  return (
    typeof mod === "object" &&
    mod !== null &&
    "name" in mod &&
    "autocomplete" in mod &&
    typeof (mod as AutoCompleteCommand).autocomplete === "function"
  );
}

export const AutoCompleteCommands: AutoCompleteCommand[] = await discoverModules(
  join(__dirname, "autoCompleteCommands"),
  isAutoCompleteCommand,
  "autocomplete command",
);
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/utils/loadCommands.ts` | **Create** | Generic `discoverModules()` utility |
| `src/Commands.ts` | **Modify** | Replace manual imports with `discoverModules()` call |
| `src/AutoCompleteCommands.ts` | **Modify** | Replace manual imports with `discoverModules()` call |
| `src/__tests__/utils/loadCommands.test.ts` | **Create** | Tests for discovery utility |
| `src/__tests__/listeners/Commands.test.ts` | **Modify** | Update to work with dynamic loading |

#### Testing Strategy

1. **Unit tests for `discoverModules()`:**
   - Creates temp directories with valid/invalid modules
   - Validates that valid modules are loaded and invalid ones are skipped with warnings
   - Tests error handling for missing directories

2. **Integration test:**
   - Verify that `Commands` array contains all 11 expected commands after discovery
   - Verify that `AutoCompleteCommands` array contains all 6 expected handlers
   - Confirm that existing command tests still pass

3. **Regression test:**
   - Run full test suite — all existing tests must pass unchanged

#### Dependencies

None — this is a standalone change.

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ESM dynamic import timing | Low | Medium | Top-level `await` is supported in ESM; test with `tsx` runtime |
| File ordering differs from manual array | Low | Low | Sort alphabetically for deterministic order |
| Non-command files in `commands/` directory | Low | Low | Validation predicate rejects malformed exports |
| Helper files (e.g., `Attack.ts`, `AttackOptions.ts`) loaded as commands | Medium | Medium | Add `IGNORED_FILES` list or use naming convention (only files exporting `Command` shape are loaded) |

**Specific concern:** The `src/commands/` directory contains helper files like `Attack.ts`, `AttackOptions.ts`, `AttackOption.ts`, `AttackOptionComponentBuilder.ts`, and `AttackCommandOptions.ts` that are NOT commands. The `isCommand` validation predicate handles this — these files don't export objects with both `name` and `run` properties matching the `Command` interface.

---

### A2. Graceful Shutdown

**Sources:** Rawon (Section 9), EvoBot (Section 11)

#### Problem Statement

The bot has no `SIGINT`/`SIGTERM` signal handlers. When the process is terminated (deployment, Ctrl+C, container orchestrator), in-flight interactions may be abandoned mid-response. The existing `unhandledRejection` and `unhandledException` listeners are discord.js client events, not process-level handlers — they don't cover process termination.

#### Solution

Add process-level signal handlers in `Bot.ts` that:
1. Log the shutdown signal
2. Call `client.destroy()` to cleanly disconnect from Discord
3. Exit with appropriate code

#### Before Code

```typescript
// src/Bot.ts (current — no shutdown handling)
const client = new Client({
    intents: []
})

ready(client);
interactionCreate(client);
unhandledRejection(client);
unhandledException(client);

client.login(token);

// Process just dies on SIGINT/SIGTERM — no cleanup
```

#### After Code

```typescript
// src/Bot.ts (after — with graceful shutdown)
const client = new Client({
    intents: []
})

ready(client);
interactionCreate(client);
unhandledRejection(client);
unhandledException(client);

client.login(token);

// ── Graceful Shutdown ───────────────────────────────────────────
// Adapted from Rawon's shutdown pattern (research report 02, Section 9).
// Ensures clean disconnect from Discord gateway on process termination.

function gracefulShutdown(signal: string): void {
    logger.info({ signal }, "Received shutdown signal — cleaning up...");

    try {
        client.destroy();
        logger.info("Discord client destroyed.");
    } catch (err) {
        logger.error({ err }, "Error during client.destroy()");
    }

    process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Process-level exception handlers (complement the discord.js client handlers)
process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception — shutting down");
    try { client.destroy(); } catch { /* best-effort */ }
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection (process-level)");
    // Log but don't exit — let the process continue (matches current behavior)
});
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/Bot.ts` | **Modify** | Add `SIGINT`/`SIGTERM` handlers and process-level exception handlers |
| `src/__tests__/Bot.test.ts` | **Modify** | Add tests for shutdown signal handling |

#### Testing Strategy

1. **Unit test:** Mock `process.on` and `client.destroy()`, verify shutdown handler calls `destroy()` and `process.exit(0)`
2. **Integration test:** Start bot, send `SIGINT`, verify clean exit
3. **Regression:** Existing Bot tests continue to pass

#### Dependencies

None — standalone change.

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Double `process.exit` call | Low | Low | Guard with `isShuttingDown` flag |
| `client.destroy()` throws | Low | Low | Wrapped in try/catch |
| Process handlers interfere with test runner | Low | Medium | Use `process.removeListener()` in test teardown |

---

### A3. Per-Command Cooldowns

**Sources:** EvoBot (Section 6), LavaMusic (Section 5)

#### Problem Statement

There is no rate limiting on command usage. A user can spam any command as fast as Discord allows, which can trigger Discord API rate limits and degrade bot performance for other users.

#### Solution

Add an optional `cooldown` field (in seconds) to the `Command` interface. Track per-user, per-command timestamps in a `Collection`. If a user invokes a command before the cooldown expires, reply with an ephemeral message showing the remaining time.

#### Before Code

```typescript
// src/Command.ts (current)
import { CommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
    run: (client: Client, interaction: CommandInteraction) => void;
}
```

```typescript
// src/listeners/interactionCreate.ts (current — no cooldown check)
const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    try{
        const slashCommand = Commands.find(c => c.name === interaction.commandName);
        if (!slashCommand) {
            interaction.followUp({ content: "An error has occurred" });
            return;
        }

        await interaction.deferReply();

        slashCommand.run(client, interaction);
    } catch (ex) {
        logger.error({ err: ex }, 'Errored handling slash command.')
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
};
```

#### After Code

```typescript
// src/Command.ts (after — with optional cooldown)
import { CommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
    /** Per-user cooldown in seconds. Default: 1. Set to 0 to disable. */
    cooldown?: number;
    run: (client: Client, interaction: CommandInteraction) => void;
}
```

```typescript
// src/listeners/interactionCreate.ts (after — with cooldown enforcement)
import { AutocompleteInteraction, Client, CommandInteraction, Collection, Interaction } from "discord.js";
import { Commands } from "../Commands.js";
import { AutoCompleteCommands } from '../AutoCompleteCommands.js';
import { UpdateStatus } from "./UpdateStatus.js";
import { logger } from "../logger.js";

// ── Cooldown tracking ───────────────────────────────────────────
// Per-command Map of per-user timestamps. Adapted from EvoBot's pattern.
const cooldowns = new Collection<string, Collection<string, number>>();

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        try{
            UpdateStatus.startThinking(client)
            if (interaction.isCommand() || interaction.isContextMenuCommand()) {
                await handleSlashCommand(client, interaction);
            } else if (interaction.isAutocomplete()) {
                await handleAutoCompleteCommand(client, interaction as AutocompleteInteraction);
            }
            UpdateStatus.doSomethingRandom(client)
        } catch (ex) {
            logger.error({ err: ex }, 'Errored during interaction handler.')
        }
    });
};

const handleAutoCompleteCommand = async (client: Client, interaction: AutocompleteInteraction): Promise<void> => {
    const command = AutoCompleteCommands.find(c => c.name === interaction.commandName);
    if (!command) {
        logger.debug({ commandName: interaction.commandName }, 'No registered Autocomplete Command')
        return;
    }
    await interaction.respond(await command.autocomplete(client, interaction))
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    try{
        const slashCommand = Commands.find(c => c.name === interaction.commandName);
        if (!slashCommand) {
            interaction.followUp({ content: "An error has occurred" });
            return;
        }

        // ── Cooldown check ──────────────────────────────────────
        const cooldownSeconds = slashCommand.cooldown ?? 1;
        if (cooldownSeconds > 0) {
            if (!cooldowns.has(slashCommand.name)) {
                cooldowns.set(slashCommand.name, new Collection());
            }
            const timestamps = cooldowns.get(slashCommand.name)!;
            const now = Date.now();
            const userId = interaction.user.id;
            const cooldownMs = cooldownSeconds * 1000;

            const lastUsed = timestamps.get(userId);
            if (lastUsed) {
                const expiresAt = lastUsed + cooldownMs;
                if (now < expiresAt) {
                    const remaining = ((expiresAt - now) / 1000).toFixed(1);
                    await interaction.reply({
                        content: `⏱️ Please wait ${remaining}s before using \`/${slashCommand.name}\` again.`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            timestamps.set(userId, now);
            setTimeout(() => timestamps.delete(userId), cooldownMs);
        }

        await interaction.deferReply();

        slashCommand.run(client, interaction);
    } catch (ex) {
        logger.error({ err: ex }, 'Errored handling slash command.')
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
};
```

#### Example: Adding Cooldown to a Command

```typescript
// src/commands/Hello.ts (after — with 5-second cooldown)
export const Hello: Command = {
    name: "hello",
    description: "Returns a greeting",
    type: ApplicationCommandType.ChatInput,
    cooldown: 5,  // 5-second per-user cooldown
    run: async (client: Client, interaction: CommandInteraction) => {
        const content = "Hello there!";
        await interaction.followUp({ ephemeral: true, content });
    }
};
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/Command.ts` | **Modify** | Add optional `cooldown` field to interface |
| `src/listeners/interactionCreate.ts` | **Modify** | Add cooldown tracking and enforcement |
| `src/__tests__/listeners/interactionCreate.test.ts` | **Modify** | Add cooldown enforcement tests |
| `src/commands/*.ts` | **Modify** (optional) | Add `cooldown` values to commands that need them |

#### Testing Strategy

1. **Unit test:** Mock interaction, invoke command twice within cooldown window, verify second call gets ephemeral reply
2. **Unit test:** Verify cooldown expires after configured duration
3. **Unit test:** Verify commands with `cooldown: 0` bypass the check
4. **Regression:** All existing interaction handler tests pass

#### Dependencies

None — standalone change.

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Memory leak from uncleaned timestamps | Low | Low | `setTimeout` cleanup after cooldown period |
| Cooldown state lost on restart | N/A | N/A | Intentional — in-memory only (matches EvoBot) |
| Default cooldown of 1s too aggressive | Low | Low | Commands can override with `cooldown: 0` |

---

## Phase B: Near-Term (Medium Risk, High Impact)

### B1. Component Registry for Button/Select Handlers

**Sources:** LavaMusic (Section 7), EvoBot (Section 8), Ticket-Bot (Section 2)

#### Problem Statement

The `/attack` and `/paradox` commands use `awaitMessageComponent()` loops to handle button interactions. This pattern:
- Creates long-lived async scopes that are hard to test
- Ties button handling to the command's execution context
- Makes it impossible to route button interactions from outside the command
- Duplicates patterns (e.g., `splitArray()` is defined in both `AttackCommand.ts` and `ParadoxCommand.ts`)

#### Solution

Introduce a `ComponentHandler` interface and a central registry. Button/select interactions are routed through `interactionCreate` by `customId` prefix, matching them to registered handlers. The `/attack` and `/paradox` commands register their component handlers when they create interactive messages, and the central router dispatches to them.

**Custom ID Protocol:** `featureKey:action:state` encoding (e.g., `attack:roll:main`, `paradox:wisdom:3`).

#### Before Code

```typescript
// src/commands/AttackCommand.ts (current — inline awaitMessageComponent loop)
interaction.editReply({
    embeds: [embed],
    components: createActionRows(attackOptions)
})
    .then(async message => {
        try {
            while (!readyToRoll && !cancelling) {
                let response = await message.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60000
                })

                if (response.customId === 'cancel') {
                    cancelling = true
                    // ... handle cancel
                } else if (response.customId === 'roll') {
                    readyToRoll = true
                    roll(interaction, embed, attack)
                } else {
                    let attackOption = attackOptions.find(ao => ao.option === response.customId)
                    attackOption?.action(embed, attack)
                    // ... handle option
                }
            }
        } catch (e) {
            // No response after 60s
        }
    })
```

#### After Code

```typescript
// src/types/ComponentHandler.ts (new file)
import { ButtonInteraction, AnySelectMenuInteraction, ModalSubmitInteraction } from "discord.js";

/**
 * A component handler processes Discord component interactions
 * (buttons, select menus, modals) by customId prefix.
 *
 * Custom ID protocol: `featureKey:action:state`
 * Example: `attack:roll:main`, `paradox:wisdom:3`
 */
export interface ComponentHandler {
    /** Unique prefix for matching customIds (e.g., "attack", "paradox"). */
    featureKey: string;

    /** Handle a component interaction. */
    run(interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction): Promise<void>;
}
```

```typescript
// src/ComponentHandlers.ts (new file — central registry)
import { ComponentHandler } from "./types/ComponentHandler.js";
import { discoverModules } from "./utils/loadCommands.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function isComponentHandler(mod: unknown): mod is ComponentHandler {
    return (
        typeof mod === "object" &&
        mod !== null &&
        "featureKey" in mod &&
        "run" in mod &&
        typeof (mod as ComponentHandler).run === "function"
    );
}

export const ComponentHandlers: ComponentHandler[] = await discoverModules(
    join(__dirname, "componentHandlers"),
    isComponentHandler,
    "component handler",
);

/** Lookup map for O(1) dispatch by featureKey. */
export const ComponentHandlerMap = new Map(
    ComponentHandlers.map(h => [h.featureKey, h])
);
```

```typescript
// src/listeners/interactionCreate.ts (after — with component routing)
// ... existing imports ...
import { ComponentHandlerMap } from "../ComponentHandlers.js";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        try{
            UpdateStatus.startThinking(client)
            if (interaction.isCommand() || interaction.isContextMenuCommand()) {
                await handleSlashCommand(client, interaction);
            } else if (interaction.isAutocomplete()) {
                await handleAutoCompleteCommand(client, interaction as AutocompleteInteraction);
            } else if (interaction.isButton() || interaction.isAnySelectMenu()) {
                await handleComponentInteraction(interaction);
            }
            UpdateStatus.doSomethingRandom(client)
        } catch (ex) {
            logger.error({ err: ex }, 'Errored during interaction handler.')
        }
    });
};

// ... existing handleAutoCompleteCommand, handleSlashCommand ...

const handleComponentInteraction = async (
    interaction: ButtonInteraction | AnySelectMenuInteraction,
): Promise<void> => {
    // Parse featureKey from customId: "attack:roll:main" → "attack"
    const featureKey = interaction.customId.split(":")[0];
    const handler = ComponentHandlerMap.get(featureKey);

    if (!handler) {
        logger.debug({ customId: interaction.customId }, "No component handler registered");
        return;
    }

    await handler.run(interaction);
};
```

```typescript
// src/componentHandlers/AttackComponentHandler.ts (new file)
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { ComponentHandler } from "../types/ComponentHandler.js";
import { logger } from "../logger.js";

/**
 * Handles button interactions for the /attack command.
 *
 * Custom IDs:
 *   attack:roll         → Execute the attack roll
 *   attack:cancel       → Cancel the attack
 *   attack:option:{id}  → Apply an attack option
 */
export const AttackComponentHandler: ComponentHandler = {
    featureKey: "attack",

    async run(interaction: ButtonInteraction): Promise<void> {
        const parts = interaction.customId.split(":");
        const action = parts[1];

        switch (action) {
            case "roll":
                await handleRoll(interaction);
                break;
            case "cancel":
                await handleCancel(interaction);
                break;
            case "option":
                await handleOption(interaction, parts[2]);
                break;
            default:
                logger.warn({ customId: interaction.customId }, "Unknown attack action");
        }
    },
};

async function handleRoll(interaction: ButtonInteraction): Promise<void> {
    // Retrieve attack state from message embed or a state store
    // Execute roll, update embed, remove components
    await interaction.update({ components: [] });
    // ... roll logic
}

async function handleCancel(interaction: ButtonInteraction): Promise<void> {
    await interaction.update({
        content: "Attack cancelled.",
        embeds: [],
        components: [],
    });
}

async function handleOption(interaction: ButtonInteraction, optionId: string): Promise<void> {
    // Apply the attack option to the embed
    await interaction.reply({ content: `Applied option: ${optionId}`, ephemeral: true });
}
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/types/ComponentHandler.ts` | **Create** | ComponentHandler interface |
| `src/ComponentHandlers.ts` | **Create** | Central registry with discovery |
| `src/componentHandlers/AttackComponentHandler.ts` | **Create** | Attack button handler |
| `src/componentHandlers/ParadoxComponentHandler.ts` | **Create** | Paradox button handler |
| `src/listeners/interactionCreate.ts` | **Modify** | Add component routing |
| `src/commands/AttackCommand.ts` | **Modify** | Use component customIds instead of awaitMessageComponent |
| `src/commands/ParadoxCommand.ts` | **Modify** | Use component customIds instead of awaitMessageComponent |
| `src/__tests__/componentHandlers/*.test.ts` | **Create** | Tests for each component handler |

#### Testing Strategy

1. **Unit tests:** Mock `ButtonInteraction` with specific `customId` values, verify correct handler dispatch
2. **Unit tests:** Test each handler's logic in isolation (roll, cancel, option)
3. **Integration test:** Verify that `interactionCreate` correctly routes button interactions to component handlers
4. **Regression:** Existing attack/paradox command tests still pass (may need refactoring)

#### Dependencies

- **A1 (Filesystem Discovery)** — Component handlers use the same `discoverModules()` utility, but this is optional; the handlers can be manually registered if A1 is not yet done.

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| State management for interactive commands | High | Medium | Need a strategy for passing attack/paradox state to component handlers (see below) |
| Custom ID length limit (100 chars) | Low | Low | Keep customIds short; `attack:roll` is well under limit |
| Breaking existing interactive command flow | Medium | Medium | Implement alongside existing pattern, switch over when ready |

**State management concern:** The current `/attack` command builds an `Attack` object in closure scope. With a component registry, this state must be stored somewhere accessible to the handler. Options:
1. **Embed fields** — Encode state in the embed's fields (the handler reads from the message)
2. **In-memory state store** — `Map<string, AttackState>` keyed by `interaction.id`
3. **Custom ID encoding** — Encode minimal state in the customId itself

Recommend starting with option 1 (embed fields) for the initial migration, then moving to option 2 if more complex state is needed.

---

### B2. i18n Support

**Sources:** EvoBot (Section 9), Rawon (Section 10), LavaMusic (Section 9), Ticket-Bot (Section 4)

#### Problem Statement

All user-facing strings (command descriptions, error messages, embed content) are hardcoded in English. Adding multi-language support requires touching every command file. Discord's localization API (`name_localizations`, `description_localizations`) is not utilized.

#### Solution

Add `typesafe-i18n` for compile-time safe translations. Start with English only, then add Discord's localization API for command descriptions. Per-guild language preference stored via the API (when available) or defaulting to English.

#### Before Code

```typescript
// src/commands/Hello.ts (current — hardcoded English)
export const Hello: Command = {
    name: "hello",
    description: "Returns a greeting",
    type: ApplicationCommandType.ChatInput,
    run: async (client: Client, interaction: CommandInteraction) => {
        const content = "Hello there!";
        await interaction.followUp({ ephemeral: true, content });
    }
};
```

#### After Code

```typescript
// src/i18n/en/index.ts (new — English translations)
export default {
    commands: {
        hello: {
            description: "Returns a greeting",
            response: "Hello there!",
        },
        roll: {
            description: "Roll dice for a skill check",
            // ... more keys
        },
        // ... all commands
    },
    common: {
        cooldownMessage: "Please wait {time}s before using /{name} again.",
        errorGeneric: "There was an error while executing this command!",
        errorNotFound: "An error has occurred",
    },
} as const;
```

```typescript
// src/i18n/i18n-types.ts (auto-generated by typesafe-i18n)
export type Translation = typeof import("./en/index").default;
export type TranslationKeys = Translation;
// ... generated type-safe accessors
```

```typescript
// src/commands/Hello.ts (after — using i18n)
import { LL } from "../i18n/i18n.js";

export const Hello: Command = {
    name: "hello",
    description: LL.commands.hello.description(),  // "Returns a greeting"
    type: ApplicationCommandType.ChatInput,
    run: async (client: Client, interaction: CommandInteraction) => {
        const content = LL.commands.hello.response();  // "Hello there!"
        await interaction.followUp({ ephemeral: true, content });
    }
};
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `package.json` | **Modify** | Add `typesafe-i18n` dependency |
| `.typesafe-i18n.ts` | **Create** | typesafe-i18n config |
| `src/i18n/en/index.ts` | **Create** | English translations |
| `src/i18n/i18n-types.ts` | **Create** (auto-generated) | Type-safe translation keys |
| `src/i18n/i18n.ts` | **Create** | i18n initialization and export |
| `src/i18n/i18n-util.ts` | **Create** (auto-generated) | Utility functions |
| `src/i18n/i18n-util-sync.ts` | **Create** (auto-generated) | Sync loader |
| `src/commands/*.ts` | **Modify** | Replace hardcoded strings with translation keys |
| `src/listeners/interactionCreate.ts` | **Modify** | Use i18n for cooldown/error messages |
| `src/embedBuilders/*.ts` | **Modify** | Use i18n for embed field names/values |

#### Testing Strategy

1. **Unit test:** Verify that `LL` returns correct strings for all keys
2. **Unit test:** Verify fallback to English when translation is missing
3. **Regression:** All existing tests pass (translations return same English strings)

#### Dependencies

None for English-only. Per-guild language requires API integration (future work).

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Touches every command file | High | Low | Can be done incrementally — one command at a time |
| Build step for type generation | Low | Low | typesafe-i18n generates on `npm run dev` |
| Runtime overhead | Low | Negligible | Typesafe-i18n is compile-time; runtime lookup is O(1) |

---

### B3. Zod Environment Validation

**Sources:** LavaMusic (Section 10)

#### Problem Statement

Environment variables are read via `process.env["KEY"]` scattered across multiple files (`Bot.ts`, `apiClient.ts`, `logger.ts`). There is no validation that required variables are present, no type coercion, and defaults are duplicated across files.

#### Solution

Create a single `src/env.ts` module that uses Zod to validate and type-check all environment variables at startup. Fail fast on missing required vars. Export a typed `env` object used throughout the codebase.

#### Before Code

```typescript
// src/Bot.ts (current — raw env reads)
const token = process.env['DISCORD_TOKEN'];
const USE_API_ROLL = process.env["USE_API_ROLL"] === "true";
const API_BASE_URL = (process.env["API_BASE_URL"] || "http://localhost:3001").replace(/\/+$/, "");
```

```typescript
// src/apiClient.ts (current — duplicated env reads)
function getApiBaseUrl(): string {
  return (process.env["API_BASE_URL"] || "http://localhost:3001").replace(/\/+$/, "");
}
function isUseApiRoll(): boolean {
  return process.env["USE_API_ROLL"] === "true";
}
```

```typescript
// src/logger.ts (current — another env read)
const level = process.env["LOG_LEVEL"] || "info";
```

#### After Code

```typescript
// src/env.ts (new file — single source of truth)
import { z } from "zod";

/**
 * Zod schema for environment variables.
 * Validates and coerces at startup — fail-fast on missing required vars.
 *
 * Inspired by LavaMusic's env validation pattern (research report 03, Section 10).
 */
const envSchema = z.object({
    // Required
    DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
    DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),

    // Optional with defaults
    DISCORD_LOGGING_CHANNEL_ID: z.string().optional(),
    DISCORD_FEEDBACK_CHANNEL_ID: z.string().optional(),
    USE_API_ROLL: z.preprocess(
        (val) => val === "true",
        z.boolean().default(false),
    ),
    API_BASE_URL: z.string().url().default("http://localhost:3001"),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parsed and validated environment.
 * Throws ZodError with descriptive messages if required vars are missing.
 */
export const env: Env = envSchema.parse(process.env);
```

```typescript
// src/Bot.ts (after — using validated env)
import { env } from "./env.js";

const token = env.DISCORD_TOKEN;         // Type: string (guaranteed non-empty)
const useApiRoll = env.USE_API_ROLL;     // Type: boolean (coerced from string)
const apiBaseUrl = env.API_BASE_URL;     // Type: string (validated URL)
```

```typescript
// src/apiClient.ts (after — remove duplicated env reads)
import { env } from "./env.js";

function getApiBaseUrl(): string {
  return env.API_BASE_URL;  // Already validated, no fallback needed
}

function isUseApiRoll(): boolean {
  return env.USE_API_ROLL;  // Already boolean
}
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `package.json` | **Modify** | Add `zod` dependency |
| `src/env.ts` | **Create** | Zod environment schema and validated `env` export |
| `src/Bot.ts` | **Modify** | Replace `process.env` reads with `env.*` |
| `src/apiClient.ts` | **Modify** | Replace `getApiBaseUrl()`/`isUseApiRoll()` with `env.*` |
| `src/logger.ts` | **Modify** | Replace `process.env["LOG_LEVEL"]` with `env.LOG_LEVEL` |
| `src/__tests__/env.test.ts` | **Create** | Tests for env validation |

#### Testing Strategy

1. **Unit test:** Verify that valid env vars parse correctly
2. **Unit test:** Verify that missing `DISCORD_TOKEN` throws descriptive ZodError
3. **Unit test:** Verify that `USE_API_ROLL=true` coerces to `true`
4. **Unit test:** Verify defaults for optional vars
5. **Regression:** All existing tests pass (test env must provide required vars)

#### Dependencies

None — standalone change.

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `env.ts` imported before `dotenv.config()` | Medium | High | Import order matters in ESM. `Bot.ts` already calls `dotenv.config()` at the top. Must ensure `env.ts` is imported after dotenv runs. Solution: use dynamic `await import("./env.js")` in `Bot.ts` after `dotenv.config()`, or move dotenv into `env.ts` itself. |
| Test environment missing required vars | Medium | Low | Add `DISCORD_TOKEN=test` to test setup or mock `process.env` |
| Breaking `apiClient.ts` lazy init pattern | Low | Low | The lazy init was to survive ESM hoisting; `env.ts` with dotenv at top solves this |

---

## Phase C: Future (Higher Risk, Medium Impact)

### C1. Two-Tier Rate Limiting

**Sources:** Discord-Bot-TypeScript-Template (Section 5), EvoBot (Section 6)

#### Problem Statement

Phase A3 adds per-command cooldowns, but there is no global rate limiting. A user could still overwhelm the bot by invoking many different commands rapidly. Additionally, cooldown values are hardcoded per command — there is no way to configure them without code changes.

#### Solution

Add a two-tier rate limiting system:
1. **Global handler rate limiter** — silently drops interactions from users who exceed a global threshold (e.g., 10 interactions per 10 seconds)
2. **Config-driven per-command cooldowns** — cooldown values loaded from a config file or env var, overriding the `Command.cooldown` field

#### Before Code

```typescript
// After A3 — cooldowns are per-command, hardcoded
export const Hello: Command = {
    cooldown: 5,  // hardcoded
    // ...
};
```

#### After Code

```typescript
// src/config/rateLimits.ts (new file)
export interface RateLimitConfig {
    /** Global: max interactions per user per window. */
    globalMaxInteractions: number;
    /** Global: window duration in seconds. */
    globalWindowSeconds: number;
    /** Per-command overrides: { commandName: cooldownSeconds } */
    commandCooldowns: Record<string, number>;
}

export const rateLimitConfig: RateLimitConfig = {
    globalMaxInteractions: 10,
    globalWindowSeconds: 10,
    commandCooldowns: {
        // Override defaults here without code changes
        "attack": 3,
        "paradox": 3,
        "roll": 1,
    },
};
```

```typescript
// src/listeners/interactionCreate.ts (after — two-tier enforcement)
import { rateLimitConfig } from "../config/rateLimits.js";

// Global per-user interaction timestamps
const globalTimestamps = new Collection<string, number[]>();

function checkGlobalRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowMs = rateLimitConfig.globalWindowSeconds * 1000;
    const timestamps = globalTimestamps.get(userId) ?? [];

    // Remove expired timestamps
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= rateLimitConfig.globalMaxInteractions) {
        return false; // Rate limited
    }

    recent.push(now);
    globalTimestamps.set(userId, recent);
    return true; // OK
}

// In handleSlashCommand:
if (!checkGlobalRateLimit(interaction.user.id)) {
    logger.debug({ userId: interaction.user.id }, "Global rate limit hit — dropping silently");
    return; // Silent drop — no reply
}

// Per-command cooldown (config overrides Command.cooldown field)
const cooldownSeconds = rateLimitConfig.commandCooldowns[slashCommand.name]
    ?? slashCommand.cooldown
    ?? 1;
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/config/rateLimits.ts` | **Create** | Rate limit configuration |
| `src/listeners/interactionCreate.ts` | **Modify** | Add global rate limiter, use config for cooldowns |
| `src/__tests__/listeners/interactionCreate.test.ts` | **Modify** | Add rate limiting tests |

#### Testing Strategy

1. **Unit test:** Verify global rate limiter drops interactions after threshold
2. **Unit test:** Verify config overrides take precedence over `Command.cooldown`
3. **Unit test:** Verify silent drop (no reply) on global limit

#### Dependencies

- **A3 (Per-Command Cooldowns)** — builds on the cooldown infrastructure

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Silent drops confuse users | Medium | Low | Log at debug level; consider optional ephemeral notice |
| Memory growth from timestamp arrays | Low | Low | Window-based cleanup on every check |

---

### C2. Unified Error Classification

**Sources:** Ticket-Bot (Section 2), nWoD `apiClient.ts` (existing `PostError` pattern)

#### Problem Statement

Error handling across commands is ad-hoc. The `apiClient.ts` has a well-designed `PostError` discriminated type, but other commands use generic `try/catch` with string messages. There is no centralized error handler that logs structured context and returns user-friendly messages.

#### Solution

Extend the `PostError` pattern into a general-purpose `BotError` discriminated type. Add a centralized error handler in `interactionCreate` that catches `BotError` instances, logs structured context, and returns i18n-based user-friendly messages.

#### Before Code

```typescript
// Current — ad-hoc error handling in commands
try {
    // command logic
} catch (ex) {
    logger.error({ err: ex }, 'Errored handling slash command.')
    await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
    });
}
```

#### After Code

```typescript
// src/errors/BotError.ts (new file)
/**
 * Discriminated error type for the nWoD bot.
 * Extends the PostError pattern from apiClient.ts to all bot operations.
 */
export class BotError extends Error {
    readonly kind: "user" | "system" | "api" | "validation" | "timeout";

    /** User-facing message key (for i18n). */
    readonly messageKey: string;

    /** Parameters for the i18n message. */
    readonly messageParams?: Record<string, unknown>;

    /** HTTP status code (for API errors). */
    readonly status?: number;

    /** Original error cause. */
    readonly cause?: unknown;

    constructor(opts: {
        kind: BotError["kind"];
        message: string;
        messageKey: string;
        messageParams?: Record<string, unknown>;
        status?: number;
        cause?: unknown;
    }) {
        super(opts.message);
        this.name = "BotError";
        this.kind = opts.kind;
        this.messageKey = opts.messageKey;
        this.messageParams = opts.messageParams;
        this.status = opts.status;
        this.cause = opts.cause;
    }
}

/** Convenience factory for user-facing validation errors. */
export function userError(messageKey: string, params?: Record<string, unknown>): BotError {
    return new BotError({
        kind: "validation",
        message: `User error: ${messageKey}`,
        messageKey,
        messageParams: params,
    });
}
```

```typescript
// src/listeners/interactionCreate.ts (after — centralized error handling)
import { BotError } from "../errors/BotError.js";

// In handleSlashCommand:
try {
    slashCommand.run(client, interaction);
} catch (ex) {
    if (ex instanceof BotError) {
        logger.warn({
            err: ex,
            kind: ex.kind,
            command: slashCommand.name,
            userId: interaction.user.id,
        }, `Command error [${ex.kind}]`);

        const userMessage = LL.errors[ex.messageKey]?.(ex.messageParams)
            ?? "An unexpected error occurred.";

        await interaction.reply({ content: userMessage, ephemeral: true }).catch(() => {});
    } else {
        logger.error({ err: ex, command: slashCommand.name }, "Unhandled command error");
        await interaction.reply({
            content: LL.common.errorGeneric(),
            ephemeral: true,
        }).catch(() => {});
    }
}
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/errors/BotError.ts` | **Create** | Discriminated error type |
| `src/listeners/interactionCreate.ts` | **Modify** | Centralized error handler |
| `src/commands/*.ts` | **Modify** (optional) | Replace generic throws with `BotError` |
| `src/__tests__/errors/BotError.test.ts` | **Create** | Error type tests |

#### Testing Strategy

1. **Unit test:** Verify `BotError` instances are correctly classified by kind
2. **Unit test:** Verify centralized handler logs structured context
3. **Unit test:** Verify user-friendly messages are returned (via i18n keys)
4. **Integration test:** Throw `BotError` from a command, verify end-to-end handling

#### Dependencies

- **B2 (i18n)** — for user-friendly message keys (optional; can use hardcoded English initially)
- **A3 (Cooldowns)** — error handler integrated into the same `interactionCreate` flow

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-engineering for 11 commands | Medium | Low | Start with just the `BotError` type; migrate commands gradually |
| Breaking existing error messages | Low | Low | Fallback to hardcoded English if i18n key missing |

---

### C3. Embed Builder Refactor

**Sources:** nWoD `embedBuilders/` (existing pattern)

#### Problem Statement

Embed builders are static methods that mutate `EmbedBuilder` instances passed as arguments. This pattern:
- Is not composable (can't chain builders)
- Requires callers to create the `EmbedBuilder` first, then pass it
- Makes it hard to add i18n support (strings are hardcoded in builders)
- Duplicates patterns (e.g., chunking logic)

#### Solution

Refactor embed builders to use a fluent builder pattern with i18n support. Each builder is a class that produces an `EmbedBuilder` via a `.build()` method.

#### Before Code

```typescript
// src/embedBuilders/SpellEmbedBuilder.ts (current)
export const SpellEmbedBuilder = {
    buildSpellEmbed(spell: Spell, embed: EmbedBuilder) {
        embed.setTitle(spell.titleString())
        if (spell.requirements && spell.requirements.length > 0) {
            embed.addFields({ name: 'Requirements', value: spell.requirementsString(), inline: false })
        }
        embed.addFields(
            { name: 'Practice', value: spell.practiceString(), inline: true },
            // ...
        )
    }
}
```

#### After Code

```typescript
// src/embedBuilders/SpellEmbedBuilder.ts (after — fluent builder)
import { EmbedBuilder } from "discord.js";
import { Spell } from "@nwod-angel/nwod-core";
import { chunkText } from "./chunkText.js";
import { LL } from "../i18n/i18n.js";

export class SpellEmbed {
    private embed = new EmbedBuilder();

    constructor(private spell: Spell) {
        this.embed.setTitle(spell.titleString());
    }

    withRequirements(): this {
        if (this.spell.requirements?.length > 0) {
            this.embed.addFields({
                name: LL.embeds.spell.requirements(),
                value: this.spell.requirementsString(),
            });
        }
        return this;
    }

    withDetails(): this {
        this.embed.addFields(
            { name: LL.embeds.spell.practice(), value: this.spell.practiceString(), inline: true },
            { name: LL.embeds.spell.action(), value: this.spell.action, inline: true },
            { name: LL.embeds.spell.duration(), value: this.spell.duration, inline: true },
            { name: LL.embeds.spell.aspect(), value: this.spell.aspect, inline: true },
            { name: LL.embeds.spell.cost(), value: this.spell.cost, inline: true },
        );
        return this;
    }

    withDescription(): this {
        const chunks = chunkText(this.spell.description);
        chunks.forEach((chunk, i) => {
            this.embed.addFields({
                name: `${LL.embeds.spell.effect()} (${i + 1}/${chunks.length})`,
                value: chunk,
            });
        });
        return this;
    }

    withSources(): this {
        this.embed.addFields({
            name: LL.embeds.spell.sources(),
            value: this.spell.sourcesString(),
        });
        return this;
    }

    build(): EmbedBuilder {
        return this.embed;
    }
}

// Usage:
const embed = new SpellEmbed(spell)
    .withRequirements()
    .withDetails()
    .withDescription()
    .withSources()
    .build();
```

#### Files Affected

| File | Action | Description |
|------|--------|-------------|
| `src/embedBuilders/SpellEmbedBuilder.ts` | **Modify** | Refactor to fluent builder |
| `src/embedBuilders/RollEmbedBuilder.ts` | **Modify** | Refactor to fluent builder |
| `src/embedBuilders/MeritEmbedBuilder.ts` | **Modify** | Refactor to fluent builder |
| `src/embedBuilders/RuleEmbedBuilder.ts` | **Modify** | Refactor to fluent builder |
| `src/commands/*.ts` | **Modify** | Update callsites to use new builders |
| `src/__tests__/embedBuilders/*.test.ts` | **Modify** | Update tests for new API |

#### Testing Strategy

1. **Unit test:** Each builder method returns `this` for chaining
2. **Unit test:** `.build()` produces expected `EmbedBuilder`
3. **Regression:** Existing embed builder tests updated to use new API

#### Dependencies

- **B2 (i18n)** — for translation keys in embed field names (optional; can use hardcoded English initially)

#### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing callsites | High | Low | Update callsites alongside builder refactor |
| Over-engineering for current needs | Medium | Low | Only refactor builders that benefit from chaining |

---

## Dependency Graph

```
Phase A (Independent — can be done in any order)
├── A1. Filesystem Command Discovery
├── A2. Graceful Shutdown
└── A3. Per-Command Cooldowns

Phase B (Some dependencies)
├── B1. Component Registry ────────── depends on A1 (optional: uses discoverModules)
├── B2. i18n Support ─────────────── independent
└── B3. Zod Environment Validation ─ independent

Phase C (Builds on earlier phases)
├── C1. Two-Tier Rate Limiting ────── depends on A3 (cooldown infrastructure)
├── C2. Unified Error Classification ─ depends on B2 (i18n, optional)
└── C3. Embed Builder Refactor ─────── depends on B2 (i18n, optional)
```

**Critical path:** A1 → B1 (component registry uses discovery)
**Parallel path:** A2, A3, B2, B3 are all independent and can be done simultaneously

---

## Phase Timeline Estimates

### Phase A: Immediate (1–2 days)

| Item | Estimate | Notes |
|------|----------|-------|
| A1. Filesystem Command Discovery | 3–4 hours | Utility + migration + tests |
| A2. Graceful Shutdown | 1–2 hours | Small change, well-defined |
| A3. Per-Command Cooldowns | 2–3 hours | Interface change + handler + tests |
| **Phase A Total** | **6–9 hours** | ~1–1.5 days |

### Phase B: Near-Term (3–5 days)

| Item | Estimate | Notes |
|------|----------|-------|
| B1. Component Registry | 4–6 hours | Interface + registry + attack handler migration |
| B2. i18n Support | 4–6 hours | Setup + English translations + migrate a few commands |
| B3. Zod Environment Validation | 2–3 hours | Schema + migrate env reads + tests |
| **Phase B Total** | **10–15 hours** | ~2–3 days |

### Phase C: Future (2–3 days)

| Item | Estimate | Notes |
|------|----------|-------|
| C1. Two-Tier Rate Limiting | 2–3 hours | Config + global limiter |
| C2. Unified Error Classification | 3–4 hours | Error type + handler + migrate |
| C3. Embed Builder Refactor | 4–6 hours | Refactor 4 builders + update callsites |
| **Phase C Total** | **9–13 hours** | ~1.5–2 days |

### Total Estimated Effort: 5–8 days

---

## Rollback Strategy

Each item is designed to be independently rollback-safe.

### Phase A Rollback

| Item | Rollback Method |
|------|----------------|
| A1. Filesystem Discovery | Revert `Commands.ts` and `AutoCompleteCommands.ts` to manual imports. The `discoverModules()` utility can remain (unused). |
| A2. Graceful Shutdown | Remove `process.on()` handlers from `Bot.ts`. No other code depends on them. |
| A3. Per-Command Cooldowns | Remove `cooldown` field from commands (defaults to 1s). Or revert `interactionCreate.ts` to pre-cooldown version. |

### Phase B Rollback

| Item | Rollback Method |
|------|----------------|
| B1. Component Registry | Revert `interactionCreate.ts` to not route components. Revert attack/paradox commands to `awaitMessageComponent()` loops. |
| B2. i18n | Replace `LL.*()` calls with hardcoded strings. Remove `typesafe-i18n` dependency. |
| B3. Zod Environment | Revert to `process.env["KEY"]` reads. Remove `zod` dependency. |

### Phase C Rollback

| Item | Rollback Method |
|------|----------------|
| C1. Rate Limiting | Remove global rate limiter from `interactionCreate.ts`. Revert to A3 cooldowns only. |
| C2. Error Classification | Revert to generic `try/catch`. Remove `BotError` class. |
| C3. Embed Builders | Revert builders to static method pattern. |

### General Rollback Principles

1. **Git revert** — Each item should be a separate PR/commit for clean revert
2. **Feature flags** — Items can be feature-flagged via env vars (e.g., `ENABLE_COMPONENT_REGISTRY=true`)
3. **Parallel patterns** — During migration, run old and new patterns side-by-side before removing old

---

## Success Criteria

### Phase A Completion Criteria

- [ ] Adding a new command requires only creating a file in `src/commands/` (no manual imports)
- [ ] Bot logs shutdown signal and calls `client.destroy()` on `SIGINT`/`SIGTERM`
- [ ] Commands with `cooldown` field enforce per-user rate limiting
- [ ] All existing tests pass
- [ ] New functionality has >80% test coverage

### Phase B Completion Criteria

- [ ] Button/select interactions are routed through a central component registry
- [ ] Command descriptions use i18n translation keys
- [ ] Environment variables are validated at startup with Zod
- [ ] Missing required env vars produce a clear error message on startup
- [ ] All existing tests pass

### Phase C Completion Criteria

- [ ] Global rate limiter silently drops excessive interactions
- [ ] Command cooldowns are configurable without code changes
- [ ] `BotError` discriminated type is used for structured error handling
- [ ] Embed builders use fluent pattern with i18n support
- [ ] All existing tests pass

### Overall Success Metrics

| Metric | Target |
|--------|--------|
| Test coverage | ≥80% (maintained) |
| Time to add new command | <5 minutes (create file only) |
| Time to add new button handler | <10 minutes (create file only) |
| Startup validation | All required env vars checked before login |
| Graceful shutdown | `client.destroy()` called on all exit paths |
| Error consistency | All user-facing errors use `BotError` + i18n keys |

---

## Appendix: Source References

| Report | Repository | Key Patterns Adopted |
|--------|-----------|---------------------|
| 01-evobot-architecture.md | [eritislami/evobot](https://github.com/eritislami/evobot) | Filesystem discovery, cooldown pattern |
| 02-rawon-architecture.md | [stegripe/rawon](https://github.com/stegripe/rawon) | Graceful shutdown, SQLite persistence |
| 03-lavamusic-architecture.md | [bongo-devs/lavamusic](https://github.com/bongo-devs/lavamusic) | Build-time registry, Zod env validation, component system |
| 04-discord-bot-template-architecture.md | [KevinNovak/Discord-Bot-TypeScript-Template](https://github.com/KevinNovak/Discord-Bot-TypeScript-Template) | Rate limiting, handler-based architecture |
| 05-ticket-bot-architecture.md | [Sayrix/Ticket-Bot](https://github.com/Sayrix/Ticket-Bot) | Component registry, custom-id encoding, error classification |

---

*Implementation plan generated 2026-06-20. Based on analysis of 5 open-source discord.js bots and the current nWoD bot architecture at `discord-bot/src/`.*
