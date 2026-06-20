# Sayrix/Ticket-Bot — Architecture Report

> **Repository:** [github.com/Sayrix/Ticket-Bot](https://github.com/Sayrix/Ticket-Bot)
> **Stars:** 499 · **Language:** TypeScript (97.1%) · **Version:** 4.0.0 · **License:** AGPL-3.0-only
> **Purpose:** Open-source Discord ticket management bot with buttons, slash commands, select menus, modals, and transcript system.

---

## 1. Overview

Ticket-Bot is a production-grade Discord bot for managing support tickets. It distinguishes itself from typical discord.js bots by using the **low-level `@discordjs/core`** API instead of the high-level `discord.js` Client. This gives it fine-grained control over every Discord API call, a smaller memory footprint, and no automatic caching or entity resolution.

### Technology Stack

| Layer | Technology |
|---|---|
| Discord API | `@discordjs/core` 2.4.0, `@discordjs/rest`, `@discordjs/ws` |
| Database | Drizzle ORM + `@libsql/client` (SQLite, Turso-compatible) |
| i18n | `typesafe-i18n` with generated TypeScript types |
| Runtime | Bun (primary) or Node.js ≥ 20 |
| Linting/Formatting | Biome |
| Build | TypeScript 6.x with `resolve-tspaths` |

### Key Dependencies

- **`@discordjs/core`** — Low-level Discord API client (no caching, no entity resolution)
- **`@discordjs/rest`** — REST API wrapper with rate limit handling
- **`@discordjs/ws`** — WebSocket gateway manager
- **`drizzle-orm`** — Type-safe SQL ORM
- **`typesafe-i18n`** — Compile-time safe internationalization
- **`@ticketpm/core`, `@ticketpm/discord-api`** — Ticket.pm integration for transcript hosting

---

## 2. Architecture Pattern

Ticket-Bot follows a **feature-based modular architecture** with clear separation between framework primitives and business logic.

### Architectural Principles

1. **Core framework** (`src/core/`) provides reusable primitives: types, router, registry, discovery, custom-id encoding, response helpers, command/feature/event definitions, i18n, and logging.
2. **Feature modules** (`src/features/`) contain business logic grouped by domain: tickets, commands, logs.
3. **Unidirectional dependency flow:** `index.ts` → `app.ts` (composition root) → `core/` + `features/` + `events/` + `db/` + `config/`.
4. **No circular dependencies** — features depend on core, never the reverse.

### Dependency Graph

```
index.ts
  └── app.ts (composition root)
        ├── core/discovery.ts    → discovers features, commands, events
        ├── core/registry.ts     → builds handler maps
        ├── core/router.ts       → dispatches interactions
        ├── core/i18n.ts         → loads translations
        ├── core/logger.ts       → structured logging
        ├── config/config.ts     → versioned configuration
        ├── db/schema.ts         → Drizzle ORM schema
        └── features/
              ├── tickets/       → ticket lifecycle (open, close, claim)
              ├── commands/      → slash command definitions
              └── logs/          → audit log service
```

### Composition Root (`app.ts`)

`app.ts` is the **composition root** — it wires all dependencies together:

```typescript
export async function createBotApp() {
  const logger = createLogger("bot");
  const db = drizzle(process.env.DB_FILE_NAME);
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const gateway = new WebSocketManager({ token: process.env.DISCORD_TOKEN, intents: GatewayIntentBits.Guilds, rest });
  const client = new Client({ rest, gateway });

  // Filesystem-based discovery
  const [commands, events, features] = await Promise.all([
    discoverCommands(logger),
    discoverEvents(logger),
    discoverFeatures(logger)
  ]);

  const i18n = createBotI18n(botConfig.lang, logger);
  const registry = createHandlerRegistry({ commands, features, events, logger, LL: i18n.LL });
  const router = new InteractionRouter(app);

  // BotApp is the single dependency bag passed everywhere
  const app: BotApp = { client, db, config: botConfig, logger, locale: i18n.locale, LL: i18n.LL, registry, router };
  registerEvents(app);
  return { app, start() { gateway.connect(); }, stop() { gateway.destroy(); } };
}
```

---

## 3. Directory Structure

```
src/
  core/                        # Framework primitives
    types.ts                   # BotApp, CommandModule, FeatureModule, EventModule interfaces
    router.ts                  # InteractionRouter — dispatches by InteractionType
    registry.ts                # createHandlerRegistry(), registerEvents()
    discovery.ts               # Filesystem walker: discovers *.command.ts, *.feature.ts, events
    custom-id.ts               # createCustomId() / parseCustomId() — structured custom ID protocol
    respond.ts                 # reply(), deferReply(), editReply(), followUp(), showModal(), replyWithError()
    defineCommand.ts           # Type inference helper for CommandModule
    defineFeature.ts           # Type inference helper for FeatureModule
    defineEvent.ts             # Type inference helper for EventModule
    i18n.ts                    # createBotI18n() — loads typesafe-i18n locale
    logger.ts                  # Structured logging

  features/
    commands/                  # Slash command definitions
      add/add.command.ts       # /add — add user to ticket
      claim/claim.command.ts   # /claim — claim ticket
      cleardm/cleardm.command.ts
      close/close.command.ts   # /close — close ticket
      mass_add/mass_add.command.ts
      remove/remove.command.ts # /remove — remove user from ticket
      rename/rename.command.ts # /rename — rename ticket channel
      unclaim/unclaim.command.ts

    tickets/                   # Ticket domain feature
      feature.ts               # defineFeature({ key: "tickets", buttons, stringSelects, modals })
      ticket-workflow.ts       # Ticket creation logic (shared by commands and buttons)
      close-workflow.ts        # Close flow: beginCloseFlow → closeTicket → transcripts
      claim-workflow.ts        # Claim/unclaim logic
      panel-sync.ts            # Panel message synchronization
      transcripts.ts           # Transcript generation
      messages.ts              # Message template loading and rendering
      records.ts               # Database helper functions
      config-access.ts         # Config accessors (getTicketType, hasTicketStaffAccess)
      service.ts               # Panel interaction handlers
      participants.ts          # User access management
      utils.ts                 # Shared utilities
      constants.ts             # Constants
      types.ts                 # Domain types

    logs/                      # Audit log feature
      service.ts               # sendTicketLog()
      utils.ts                 # Log context builders

  events/
    interactionCreate.ts       # Thin dispatch → app.router.handleInteraction()
    ready.ts                   # Startup logging

  db/
    schema.ts                  # Drizzle schema: panelMessages, appMeta, tickets

  config/
    index.ts                   # defineConfig(), VersionedConfig types

messages/                      # Discord message templates as TypeScript modules
i18n/                          # typesafe-i18n translations (en, fr, etc.)
config/
  config.ts                    # User configuration (defineConfig("0.0.1", { ... }))
```

---

## 4. @discordjs/core Usage

Ticket-Bot deliberately avoids the high-level `discord.js` Client. Instead, it uses the three low-level packages directly:

```typescript
import { Client, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
const gateway = new WebSocketManager({
  token: process.env.DISCORD_TOKEN,
  intents: GatewayIntentBits.Guilds,
  rest
});
const client = new Client({ rest, gateway });
```

### Implications

| Aspect | High-level discord.js | @discordjs/core (Ticket-Bot) |
|---|---|---|
| Caching | Automatic guild/channel/member cache | **No caching** — every call hits the API |
| Entity resolution | `interaction.guild` auto-fetches | **Explicit** — `app.client.api.guilds.get(id)` |
| Memory | Higher (cache overhead) | **Lower** — no cache |
| API control | Abstracted | **Fine-grained** — every call is explicit |
| Rate limits | Handled internally | Handled by `@discordjs/rest` with logging |

### Interaction with the Discord API

All API calls go through `app.client.api.*`:

```typescript
// Create a channel
await app.client.api.guilds.createChannel(guildId, { name, type, parent_id, permission_overwrites });

// Send a message
await app.client.api.channels.createMessage(channelId, { content, components });

// Reply to an interaction
await app.client.api.interactions.reply(interaction.id, interaction.token, body);

// Edit an interaction reply
await app.client.api.interactions.editReply(applicationId, interaction.token, body);
```

---

## 5. Command Pattern

### defineCommand() Helper

A thin type-inference wrapper:

```typescript
// src/core/defineCommand.ts
export function defineCommand<const TCommand extends CommandModule>(command: TCommand) {
  return command;
}
```

### CommandModule Interface

```typescript
export interface CommandModule {
  data: CommandDataResolver;  // static object OR function: (LL) => ({ name, description })
  execute(context: CommandExecutionContext, interaction: APIChatInputApplicationCommandInteraction): Promise<void>;
  autocomplete?(context: CommandExecutionContext, interaction: APIApplicationCommandAutocompleteInteraction): Promise<void>;
}
```

### Example Command

```typescript
// src/features/commands/close/close.command.ts
export default defineCommand({
  data: {
    name: "close",
    description: "Close the current ticket",
    // ...options
  },
  async execute(context, interaction) {
    await executeCloseCommand(context, interaction);
  }
});
```

### Filesystem Discovery

Commands are discovered by walking `src/features/` for files matching `*.command.ts`:

```typescript
export async function discoverCommands(logger: Logger) {
  return importModules(
    featuresDirectory,
    (filePath) => isModuleFile(filePath) && filePath.endsWith("command.ts"),
    isCommandModule,
    logger,
    "commands"
  );
}
```

### Guild-Scoped Deployment

Commands are deployed to a single guild (not globally), which means:
- **Instant availability** — no global propagation delay
- **No caching issues** — guild commands update immediately
- **Single-server design** — the bot targets one guild per config

### Localized Command Data

The `data` field can be a function that receives the translation functions:

```typescript
data: (LL) => ({
  name: "close",
  description: LL.commands.close.description()
})
```

---

## 6. Interaction Router (KEY PATTERN)

The `InteractionRouter` is the central dispatch mechanism. It receives every non-Ping interaction and routes it based on `InteractionType`.

```typescript
// src/core/router.ts
export class InteractionRouter {
  public async handleInteraction(interaction: RoutedInteraction) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        await this.handleApplicationCommand(interaction);
        return;
      case InteractionType.ApplicationCommandAutocomplete:
        await this.handleAutocomplete(interaction);
        return;
      case InteractionType.MessageComponent:
        await this.handleMessageComponent(interaction);
        return;
      case InteractionType.ModalSubmit:
        await this.handleModalSubmit(interaction);
        return;
    }
  }
}
```

### Routing Logic

| Interaction Type | Routing Strategy |
|---|---|
| `ApplicationCommand` | Lookup by `interaction.data.name` in `registry.commands` |
| `ApplicationCommandAutocomplete` | Same lookup, calls `command.autocomplete()` |
| `MessageComponent` | Parse `custom_id` via `parseCustomId()`, lookup feature by `featureKey`, dispatch to `buttons` or `stringSelects` handler |
| `ModalSubmit` | Same `custom_id` parsing, dispatch to `modals` handler |

### Message Component Routing (Detailed)

```typescript
private async handleMessageComponent(interaction: APIMessageComponentInteraction) {
  const route = parseCustomId(interaction.data.custom_id);
  const feature = this.app.registry.features.get(route.featureKey);
  const context: ComponentExecutionContext = { app: this.app, feature, route };

  if (interaction.data.component_type === ComponentType.Button) {
    const handler = feature.buttons?.[route.action];
    await handler(context, interaction);
    return;
  }

  if (interaction.data.component_type === ComponentType.StringSelect) {
    const handler = feature.stringSelects?.[route.action];
    await handler(context, interaction);
  }
}
```

### Event Entry Point

The `interactionCreate` event is a thin pass-through:

```typescript
// src/events/interactionCreate.ts
const interactionCreateEvent = defineEvent({
  name: GatewayDispatchEvents.InteractionCreate,
  async execute(app, event) {
    if (event.data.type === InteractionType.Ping) return;
    await app.router.handleInteraction(event.data);
  }
});
```

---

## 7. Custom ID Protocol (KEY PATTERN)

The custom ID protocol is a **structured encoding scheme** that replaces ad-hoc string concatenation with a type-safe, parseable format.

### Format

```
featureKey:action:state[0]:state[1]:...
```

### Implementation

```typescript
// src/core/custom-id.ts
const CUSTOM_ID_SEPARATOR = ":";

export interface ParsedCustomId {
  featureKey: string;
  action: string;
  state: string[];
}

export function createCustomId(featureKey: string, action: string, ...state: string[]) {
  return [featureKey, action, ...state.map((part) => encodeURIComponent(part))].join(CUSTOM_ID_SEPARATOR);
}

export function parseCustomId(customId: string): ParsedCustomId | null {
  const [featureKey, action, ...rawState] = customId.split(CUSTOM_ID_SEPARATOR);
  if (!featureKey || !action) return null;
  return {
    featureKey,
    action,
    state: rawState.map((part) => decodeURIComponent(part))
  };
}
```

### Usage Examples

```typescript
// Creating custom IDs
createCustomId("tickets", "close")                          // "tickets:close"
createCustomId("tickets", "submit-close-reason")             // "tickets:submit-close-reason"
createCustomId("tickets", "submit-open-form", "support")     // "tickets:submit-open-form:support"
createCustomId("tickets", "open-type", "general")            // "tickets:open-type:general"

// Parsing custom IDs
parseCustomId("tickets:submit-open-form:support")
// → { featureKey: "tickets", action: "submit-open-form", state: ["support"] }
```

### Benefits

1. **Single routing mechanism** — all component interactions (buttons, selects, modals) use the same protocol
2. **State encoding** — pass runtime state through the custom ID without external storage
3. **URL encoding** — special characters in state are safely encoded
4. **Null safety** — `parseCustomId()` returns `null` for malformed IDs
5. **Feature isolation** — each feature owns its own action namespace

---

## 8. Feature Module Pattern

### defineFeature() Helper

```typescript
// src/core/defineFeature.ts
export function defineFeature<const TFeature extends FeatureModule>(feature: TFeature) {
  return feature;
}
```

### FeatureModule Interface

```typescript
export interface FeatureModule {
  key: string;
  buttons?: Record<string, ButtonHandler>;
  stringSelects?: Record<string, StringSelectHandler>;
  modals?: Record<string, ModalHandler>;
}
```

### Handler Types

```typescript
export type ButtonHandler = (context: ComponentExecutionContext, interaction: APIMessageComponentInteraction) => Promise<void>;
export type StringSelectHandler = (context: ComponentExecutionContext, interaction: APIMessageComponentInteraction) => Promise<void>;
export type ModalHandler = (context: ComponentExecutionContext, interaction: APIModalSubmitInteraction) => Promise<void>;
```

### Example: Tickets Feature

```typescript
// src/features/tickets/feature.ts
const ticketsFeature = defineFeature({
  key: "tickets",
  buttons: {
    "claim": handleClaimButton,
    "close": handleCloseButton,
    "delete-closed": handleDeleteClosedTicketButton,
    "open-select": handleOpenPanelSelector,
    "open-type": handlePanelButtons,
    "unclaim": handleUnclaimButton
  },
  stringSelects: {
    "panel-select": handlePanelSelect,
    "remove-users": handleRemoveUsersSelect
  },
  modals: {
    "submit-close-reason": handleCloseReasonSubmit,
    "submit-open-form": handleOpenFormSubmit
  }
});
```

### Handler Registry

Features are registered in a `Map<string, FeatureModule>` keyed by `feature.key`:

```typescript
// src/core/registry.ts
for (const feature of features) {
  if (featureMap.has(feature.key)) {
    throw new Error(`Duplicate feature key "${feature.key}" detected.`);
  }
  featureMap.set(feature.key, feature);
}
```

---

## 9. Workflow Extraction (KEY PATTERN)

Business logic is extracted into **workflow files** that are shared between slash commands and button handlers. This prevents duplication and ensures consistent behavior regardless of how the user triggers an action.

### Workflow Files

| File | Responsibility |
|---|---|
| `ticket-workflow.ts` | Ticket creation: `continueTicketOpen()`, `buildTicketWelcomeMessage()`, `syncTicketWelcomeMessage()` |
| `close-workflow.ts` | Close flow: `executeCloseCommand()`, `handleCloseButton()`, `handleCloseReasonSubmit()`, `handleDeleteClosedTicketButton()` |
| `claim-workflow.ts` | Claim/unclaim: `executeClaimCommand()`, `executeUnclaimCommand()`, `handleClaimButton()`, `handleUnclaimButton()` |

### Example: Close Workflow

The `/close` command and the close button both call the same `beginCloseFlow()` function:

```typescript
// src/features/tickets/close-workflow.ts

// Called by /close command
export async function executeCloseCommand(
  context: CommandExecutionContext,
  interaction: APIChatInputApplicationCommandInteraction
) {
  await beginCloseFlow(context.app, interaction);
}

// Called by close button
export async function handleCloseButton(
  context: ComponentExecutionContext,
  interaction: APIMessageComponentInteraction
) {
  await beginCloseFlow(context.app, interaction);
}

// Shared logic
async function beginCloseFlow(
  app: BotApp,
  interaction: APIChatInputApplicationCommandInteraction | APIMessageComponentInteraction
) {
  const closable = await getClosableTicket(app, interaction.channel_id, getMemberRoleIds(interaction), getInteractionUser(interaction).id, true);
  if (!closable.ok) {
    await reply(app, interaction, { content: closable.message, flags: MessageFlags.Ephemeral });
    return;
  }

  if (app.config.tickets.close.askForReason) {
    await showModal(app, interaction, {
      custom_id: createCustomId("tickets", "submit-close-reason"),
      title: app.LL.tickets.close.modal.title(),
      components: [/* reason input */]
    });
    return;
  }

  await closeTicket(app, interaction, null);
}
```

### Claim Workflow — Same Pattern

```typescript
// /claim command → claimTicket()
export async function executeClaimCommand(context, interaction) {
  await claimTicket(context.app, interaction);
}

// Claim button → claimTicket()
export async function handleClaimButton(context, interaction) {
  await claimTicket(context.app, interaction);
}

// Shared logic
async function claimTicket(app: BotApp, interaction: ClaimInteraction) {
  // ... validation, DB update, UI sync, audit log
}
```

### Benefits

1. **DRY** — No duplicated logic between commands and buttons
2. **Consistent** — Same validation, same side effects, same error handling
3. **Testable** — Workflow functions can be unit tested independently
4. **Maintainable** — Change behavior once, affects all entry points

---

## 10. Database

### Drizzle ORM with SQLite

```typescript
import { drizzle } from "drizzle-orm/libsql";
const db = drizzle(process.env.DB_FILE_NAME);
```

### Schema

```typescript
// src/db/schema.ts
export const ticketsTable = sqliteTable("tickets", {
  id: int().primaryKey({ autoIncrement: true }),
  channelId: text().unique().notNull(),
  creationMessageId: text().unique().notNull(),
  type: text().notNull(),
  reason: text(),
  createdBy: text().notNull(),
  createdAt: int().notNull(),
  claimedAt: int(),
  claimedBy: text(),
  invitedUserIds: text().notNull().default("[]"),
  closedAt: int(),
  closedBy: text(),
  closedReason: text(),
  transcriptUrl: text()
});

export const panelMessagesTable = sqliteTable("panel_messages", {
  panelKey: text().primaryKey(),
  channelId: text().notNull(),
  messageId: text().notNull(),
  updatedAt: int().notNull()
});

export const appMetaTable = sqliteTable("app_meta", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: int().notNull()
});
```

### Query Patterns

No repository pattern — queries are inline using Drizzle's query builder:

```typescript
// Find open ticket by channel
const ticket = await app.db
  .select()
  .from(ticketsTable)
  .where(and(eq(ticketsTable.channelId, channelId), isNull(ticketsTable.closedAt)))
  .get();

// Update ticket claim
await app.db
  .update(ticketsTable)
  .set({ claimedAt: Date.now(), claimedBy: actor.id })
  .where(eq(ticketsTable.channelId, ticket.channelId));

// Count user's open tickets
const rows = await app.db
  .select({ count: count() })
  .from(ticketsTable)
  .where(and(eq(ticketsTable.createdBy, userId), isNull(ticketsTable.closedAt)));
```

---

## 11. Message Templates

Message templates are TypeScript modules in the `messages/` directory that define Discord message payloads. They support token rendering, slot injection, and Components V2.

### Template Loading

```typescript
// Templates are loaded via dynamic import
const messageTemplate = await loadMessageTemplate(app, "tickets/ticket-closed", tokens);
```

### Token Rendering

Deep recursive `{tokenName}` replacement across the entire template object:

```typescript
function renderDeep(value: unknown, tokens: Record<string, string | undefined>): unknown {
  if (typeof value === "string") return renderTemplate(value, tokens);
  if (Array.isArray(value)) return value.map((entry) => renderDeep(entry, tokens));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, renderDeep(entry, tokens)]));
  }
  return value;
}
```

### Slot Injection

Templates can define named slots where runtime components are injected:

```typescript
export function createMessageSlot(slot: string): MessageTemplateSlotComponent {
  return { type: "template-slot", slot, slot_kind: "many" };
}

// Usage in templates:
// { type: "template-slot", slot: "panel-opener" }
// { type: "template-slot", slot: "actions" }
// { type: "template-slot", slot: "runtime-text" }
```

### Components V2 Support

Templates can use Components V2 (containers, text displays, separators, etc.):

```typescript
// Components V2 messages cannot use content or embeds
// They use TextDisplay components instead
if (usesComponentsV2(payload)) {
  return appendMessageComponents(payload, [
    { type: ComponentType.TextDisplay, content: normalizedText }
  ]);
}
```

---

## 12. i18n

### typesafe-i18n Integration

The bot uses `typesafe-i18n` for fully typed internationalization:

```typescript
// src/core/i18n.ts
export function createBotI18n(requestedLocale: string, logger?: Logger) {
  const locale = isLocale(requestedLocale) ? requestedLocale : "en";
  loadLocale(locale);
  return { locale, LL: i18nObject(locale) };
}
```

### Usage

```typescript
// Fully typed translation calls
app.LL.tickets.close.status.closed()
app.LL.tickets.open.max_open_reached({ limit: 3 })
app.LL.commands.claim.success()

// Parameter interpolation
// Translation: "You can only have {limit:number} open tickets at a time."
app.LL.tickets.open.max_open_reached({ limit: 3 })
// → "You can only have 3 open tickets at a time."
```

### Command Localization

Command descriptions can be localized via the functional `data` form:

```typescript
export default defineCommand({
  data: (LL) => ({
    name: "close",
    description: LL.commands.close.description()
  }),
  // ...
});
```

---

## 13. Config System

### Versioned Configuration

```typescript
// src/config/index.ts
export function defineConfig<V extends ConfigVersion>(version: V, config: ConfigOf<V>): VersionedConfig<V> {
  return { version, ...config };
}
```

### Config Structure

```typescript
// config/config.ts
export default defineConfig("0.0.1", {
  clientId: "123456789",
  guildId: "987654321",
  lang: "en",
  logs: { enabled: true, channelId: "..." },
  status: { enabled: true, text: "tickets!", type: "WATCHING", status: "online" },
  tickets: {
    channelNameTemplate: "ticket-{ticketNumber}",
    maxOpenPerUser: 5,
    staffRoleIds: ["..."],
    blockedRoleIds: [],
    mentionRoleIds: ["..."],
    claims: {
      enabled: true,
      mode: "strict",
      showButtons: true,
      allowUnclaim: true,
      takeoverMode: "disabled"
    },
    close: {
      staffOnly: false,
      dmUserOnClose: true,
      askForReason: true,
      showCloseButton: true,
      deleteChannelOnClose: false,
      createTranscript: true
    }
  },
  ticketTypes: {
    support: {
      name: "Support",
      categoryId: "...",
      description: "Get help with general questions",
      emoji: "🎫",
      openForm: {
        title: "Open a Support Ticket",
        questions: [
          { key: "issue", label: "What do you need help with?", style: "paragraph", required: true }
        ]
      }
    }
  },
  panels: {
    main: {
      channelId: "...",
      message: "Choose a ticket type:",
      opener: { type: "inline-select", ticketTypes: ["support"], placeholder: "Select a ticket type..." }
    }
  }
});
```

### Config Accessors

```typescript
// src/features/tickets/config-access.ts
export function getTicketType(app: BotApp, key: string): TicketTypeConfig { ... }
export function getPanel(app: BotApp, key: string) { ... }
export function hasTicketStaffAccess(app: BotApp, ticketType: TicketTypeConfig, roleIds: string[]): boolean { ... }
export function userCanAccessTicketType(app: BotApp, ticketType: TicketTypeConfig, roleIds: string[]): boolean { ... }
```

---

## 14. nWoD Bot Applicability Assessment

The following patterns from Ticket-Bot are directly applicable to the nWoD Discord bot, which is component-heavy (buttons, selects, modals for dice rolls, character sheets, paradox rolls, etc.).

### Custom ID Protocol — HIGHLY APPLICABLE

**Current nWoD pattern:** Ad-hoc custom IDs in `/attack` — button customIds are hardcoded strings like `"all-out"`, `"willpower"`, `"roll"`, `"cancel"`. No structured encoding, no state passing, no generic routing.

**Ticket-Bot-style improvement:**

```typescript
// src/core/custom-id.ts
export function createCustomId(feature: string, action: string, ...state: string[]): string {
  return [feature, action, ...state.map(s => encodeURIComponent(s))].join(":");
}

export function parseCustomId(customId: string): { feature: string; action: string; state: string[] } {
  const parts = customId.split(":");
  return {
    feature: parts[0],
    action: parts[1],
    state: parts.slice(2).map(s => decodeURIComponent(s)),
  };
}
```

**Applied to /attack command:**

```typescript
// In /attack command handler:
const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId(createCustomId("attack", "toggle-option", "all-out"))
    .setLabel("All-Out Attack")
    .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
    .setCustomId(createCustomId("attack", "toggle-option", "willpower"))
    .setLabel("Willpower")
    .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
    .setCustomId(createCustomId("attack", "roll"))
    .setLabel("Roll!")
    .setStyle(ButtonStyle.Success),
);

// In interactionCreate handler:
const { feature, action, state } = parseCustomId(interaction.customId);
if (feature === "attack") {
  switch (action) {
    case "toggle-option": return handleToggleOption(interaction, state[0]); // "all-out" or "willpower"
    case "roll": return handleRoll(interaction);
  }
}
```

**Benefits for nWoD bot:**
- Pass dice pool parameters, character IDs, or roll context through custom IDs
- Single routing function handles all component interactions
- No more giant `if/else` chains checking hardcoded strings
- State survives bot restarts (encoded in the custom ID, not in memory)

### Feature Module Pattern — APPLICABLE

**Current nWoD pattern:** Each command handler has its own inline button/select handling with no shared structure.

**Ticket-Bot-style improvement:**

```typescript
// src/features/attack/feature.ts
export const attackFeature = defineFeature({
  key: "attack",
  buttons: {
    "toggle-option": handleToggleOption,
    "roll": handleRoll,
    "cancel": handleCancel,
  },
});

// src/features/paradox/feature.ts
export const paradoxFeature = defineFeature({
  key: "paradox",
  buttons: {
    "wisdom": handleWisdomChoice,
    "arcanum": handleArcanumChoice,
    "roll": handleParadoxRoll,
  },
  stringSelects: {
    "select-arcana": handleArcanaSelect,
  },
});

// src/features/character/feature.ts
export const characterFeature = defineFeature({
  key: "character",
  buttons: {
    "edit-attr": handleEditAttribute,
    "edit-skill": handleEditSkill,
    "save": handleSave,
  },
  modals: {
    "edit-stat": handleEditStatModal,
  },
});
```

**Benefits for nWoD bot:**
- Each game mechanic (attack, paradox, character sheet) is a self-contained feature
- Adding new buttons/selects is a one-line change in the feature definition
- Features can be developed and tested independently
- Clear ownership: each feature owns its custom ID namespace

### Interaction Router — APPLICABLE

**Current nWoD pattern:** `interactionCreate.ts` has a growing `if/else` chain that checks `customId.startsWith("all-out")`, `customId === "willpower"`, etc.

**Ticket-Bot-style improvement:**

```typescript
// src/core/router.ts — generic router, reusable across all nWoD features
export class InteractionRouter {
  public async handleInteraction(interaction: RoutedInteraction) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return this.handleSlashCommand(interaction);
      case InteractionType.MessageComponent:
        return this.handleMessageComponent(interaction);
      case InteractionType.ModalSubmit:
        return this.handleModalSubmit(interaction);
    }
  }

  private async handleMessageComponent(interaction: APIMessageComponentInteraction) {
    const route = parseCustomId(interaction.data.customId);
    const feature = this.registry.features.get(route.feature);
    const handler = feature.buttons?.[route.action] ?? feature.stringSelects?.[route.action];
    await handler({ app: this.app, feature, route }, interaction);
  }
}
```

**Benefits for nWoD bot:**
- `interactionCreate.ts` becomes a 5-line pass-through
- No more growing `if/else` chain as new commands are added
- Adding a new command never touches the router

### Workflow Extraction — APPLICABLE

**Current nWoD pattern:** `/attack` command builds the attack model, creates the embed, and handles button interactions all in one file. The button handlers duplicate logic from the command.

**Ticket-Bot-style improvement:**

```typescript
// src/commands/attack-workflow.ts — shared logic
export async function executeAttack(
  client: Client,
  interaction: CommandInteraction,
  options: AttackOptions
): Promise<void> {
  const attack = buildAttackModel(options);
  const embed = buildAttackEmbed(attack);
  const buttons = buildAttackButtons(attack);
  await interaction.reply({ embeds: [embed], components: buttons });
}

export async function toggleAttackOption(
  attack: Attack,
  optionName: string
): Promise<Attack> {
  return { ...attack, [optionName]: !attack[optionName] };
}

export async function resolveAttack(
  client: Client,
  attack: Attack
): Promise<RollResult> {
  const pool = calculateDicePool(attack);
  return rollDice(pool);
}

// src/commands/attack.command.ts — thin wrapper
export default defineCommand({
  data: { name: "attack", description: "Make an attack roll" },
  async execute(context, interaction) {
    const options = parseAttackOptions(interaction);
    await executeAttack(context.app, interaction, options);
  }
});

// src/features/attack/feature.ts — button handlers call same workflow
export const attackFeature = defineFeature({
  key: "attack",
  buttons: {
    "toggle-option": async (ctx, interaction) => {
      const attack = getAttackFromMessage(interaction.message);
      const updated = await toggleAttackOption(attack, ctx.route.state[0]);
      await updateAttackMessage(interaction, updated);
    },
    "roll": async (ctx, interaction) => {
      const attack = getAttackFromMessage(interaction.message);
      const result = await resolveAttack(ctx.app.client, attack);
      await sendRollResult(interaction, result);
    },
  },
});
```

**Benefits for nWoD bot:**
- `/attack` command and attack buttons share the same `executeAttack()` / `toggleAttackOption()` / `resolveAttack()` functions
- Changing dice pool logic once affects all entry points
- Workflow functions are unit-testable without Discord mocking

### BotApp Dependency Bag — APPLICABLE

**Current nWoD pattern:** Functions pass around `client` and sometimes `db` separately.

**Ticket-Bot-style improvement:**

```typescript
export interface NWoDBotApp {
  client: Client;
  db: DrizzleDB;
  config: NwodConfig;
  logger: Logger;
  LL: TranslationFunctions;
  registry: HandlerRegistry;
  router: InteractionRouter;
}
```

**Benefits for nWoD bot:**
- Single object passed to all handlers — no parameter drilling
- Easy to add new services (cache, metrics, etc.) without changing function signatures
- Consistent with Ticket-Bot's proven pattern

---

## Summary of Key Patterns

| Pattern | Ticket-Bot Implementation | nWoD Applicability |
|---|---|---|
| **Custom ID Protocol** | `featureKey:action:state[]` with URL encoding | HIGH — replaces ad-hoc string IDs |
| **Feature Modules** | `defineFeature({ key, buttons, stringSelects, modals })` | HIGH — organizes commands by domain |
| **Interaction Router** | Type-based dispatch + custom_id parsing | HIGH — eliminates if/else chains |
| **Workflow Extraction** | `-workflow.ts` files shared by commands and buttons | HIGH — prevents logic duplication |
| **BotApp Dependency Bag** | Single object with client, db, config, logger | MEDIUM — simplifies function signatures |
| **@discordjs/core** | Low-level API, no caching | LOW — nWoD bot uses discord.js Client |
| **Message Templates** | TypeScript modules with token rendering | MEDIUM — useful for complex embeds |
| **typesafe-i18n** | Generated types, parameter interpolation | LOW — single-language bot likely |
| **Versioned Config** | `defineConfig("0.0.1", { ... })` | LOW — simpler config needs |
| **Drizzle ORM** | SQLite with inline queries | MEDIUM — if bot needs persistence |

---

## Appendix: Key File References

| File | Purpose |
|---|---|
| `src/app.ts` | Composition root — wires all dependencies |
| `src/core/router.ts` | InteractionRouter — central dispatch |
| `src/core/custom-id.ts` | Custom ID encoding/decoding |
| `src/core/types.ts` | BotApp, CommandModule, FeatureModule interfaces |
| `src/core/discovery.ts` | Filesystem-based module discovery |
| `src/core/registry.ts` | Handler registry creation |
| `src/core/respond.ts` | Interaction response helpers |
| `src/features/tickets/feature.ts` | Tickets feature definition |
| `src/features/tickets/close-workflow.ts` | Close workflow (shared by command + button) |
| `src/features/tickets/claim-workflow.ts` | Claim workflow (shared by command + button) |
| `src/features/tickets/ticket-workflow.ts` | Ticket creation workflow |
| `src/features/tickets/messages.ts` | Message template loading and rendering |
| `src/db/schema.ts` | Drizzle ORM schema |
| `src/config/index.ts` | Versioned config system |
| `src/events/interactionCreate.ts` | Thin event dispatch |
