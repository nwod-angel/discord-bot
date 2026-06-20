# Discord-Bot-TypeScript-Template: Architecture Report

> **Source:** [github.com/KevinNovak/Discord-Bot-TypeScript-Template](https://github.com/KevinNovak/Discord-Bot-TypeScript-Template)
> **Date:** 2026-06-20
> **Purpose:** Evaluate architecture patterns for potential adoption in the nWoD Discord bot.

---

## 1. Overview

| Attribute | Value |
|---|---|
| **Repository** | `KevinNovak/Discord-Bot-TypeScript-Template` |
| **Stars** | ~630 |
| **Language** | TypeScript (97.9%), ESM modules |
| **Framework** | discord.js v14 |
| **License** | MIT |
| **Node** | >= 18.0.0 |

This is a production-ready Discord bot template designed as a starting point for new bots. It provides boilerplate features (sharding, rate limiting, i18n, scheduled jobs, an Express API) so developers can focus on domain-specific commands rather than infrastructure.

### Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Discord API | discord.js | ^14.22.1 |
| REST API | @discordjs/rest | ^2.6.0 |
| HTTP Server | Express | 5.1.0 |
| Rate Limiting | discord.js-rate-limiter | 1.3.2 |
| i18n | linguini | 1.3.1 |
| Scheduling | node-schedule | 2.1.1 |
| Logging | pino + pino-pretty | 9.9.0 |
| Process Manager | PM2 | ^6.0.8 |
| Testing | Vitest | ^3.2.4 |
| Container | Docker | node:16 base |

---

## 2. Architecture Pattern

The template follows a **layered, handler-based architecture** with composition over inheritance and interface-driven design.

### Key Architectural Characteristics

- **Dual entry point** — Separate processes for the shard manager (`start-manager.ts`) and individual shards (`start-bot.ts`), enabling both single-process and multi-process deployments.
- **Interface-driven composition** — Commands, events, buttons, reactions, and triggers all implement well-defined interfaces (`Command`, `EventHandler`, `Button`, `Reaction`, `Trigger`). Behavior is composed by injecting these into handler classes.
- **No database** — Intentionally stateless. The template stores no persistent data, making it a pure boilerplate. Any bot built from it adds its own persistence layer.
- **Metadata/execution separation** — Command metadata (name, description, options, localization) is defined separately from execution logic, enabling CLI-based command registration against the Discord API.
- **Aggressive cache minimization** — discord.js cache managers are explicitly zeroed out for unused data structures (emojis, bans, invites, stickers, presences, threads, voice states) to reduce memory footprint.

### Design Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                      start-manager.ts                        │
│  ShardingManager + Express API + Scheduled Jobs             │
└──────────┬──────────────────────────────────────────────────┘
           │ spawns
           ▼
┌─────────────────────────────────────────────────────────────┐
│                       start-bot.ts                           │
│  CustomClient → Bot → EventHandler[] → Command[] / etc.     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
src/
├── buttons/                    # Button interaction handlers
│   ├── button.ts               # Button interface
│   └── index.ts
├── commands/
│   ├── chat/                   # Slash command implementations
│   │   ├── dev-command.ts
│   │   ├── help-command.ts
│   │   ├── info-command.ts
│   │   └── test-command.ts
│   ├── message/                # Message context menu commands
│   │   └── view-date-sent.ts
│   ├── user/                   # User context menu commands
│   │   └── view-date-joined.ts
│   ├── args.ts                 # Shared command argument definitions
│   ├── command.ts              # Command interface + CommandDeferType enum
│   ├── metadata.ts             # Command metadata (names, descriptions, localization)
│   └── index.ts
├── constants/
│   └── discord-limits.ts       # Discord API limits (e.g., CHOICES_PER_AUTOCOMPLETE)
├── controllers/                # Express API controllers
│   ├── controller.ts           # Controller interface (path, router, authToken, register())
│   ├── guilds-controller.ts    # GET /guilds — broadcastEval across shards
│   ├── shards-controller.ts    # GET /shards — shard status
│   ├── root-controller.ts      # GET / — health check
│   └── index.ts
├── enums/                      # Command name enums, help/info option enums
├── events/                     # Event handler classes
│   ├── event-handler.ts        # EventHandler interface { process(...args): Promise<void> }
│   ├── command-handler.ts      # Routes CommandInteraction to matching Command
│   ├── button-handler.ts       # Routes ButtonInteraction to matching Button
│   ├── trigger-handler.ts      # Routes message content to matching Trigger
│   ├── reaction-handler.ts     # Routes MessageReaction to matching Reaction
│   ├── guild-join-handler.ts   # Handles bot joining a guild
│   ├── guild-leave-handler.ts  # Handles bot leaving a guild
│   ├── message-handler.ts      # Delegates to TriggerHandler
│   └── index.ts
├── extensions/
│   ├── custom-client.ts        # CustomClient extending discord.js Client
│   └── index.ts
├── jobs/                       # Scheduled jobs (node-schedule)
│   ├── job.ts                  # Abstract Job class (name, schedule, run())
│   ├── update-server-count-job.ts  # Posts server count to bot list sites
│   └── index.ts
├── middleware/                  # Express middleware
│   ├── check-auth.ts           # Bearer token authentication
│   ├── handle-error.ts         # Global error handler
│   ├── map-class.ts            # Request body → class transformer
│   └── index.ts
├── models/
│   ├── api.ts                  # Express app setup, controller registration
│   ├── bot.ts                  # Bot class — core event wiring
│   ├── manager.ts              # Manager class — ShardingManager wrapper
│   ├── config-models.ts        # BotSite config type
│   ├── internal-models.ts      # EventData type
│   ├── cluster-api/            # Request/response types for cluster API
│   ├── enum-helpers/           # Language and Permission enum helpers
│   └── master-api/             # Multi-machine clustering support
├── reactions/
│   ├── reaction.ts             # Reaction interface
│   └── index.ts
├── services/
│   ├── command-registration-service.ts  # CLI command registration (view/register/rename/delete/clear)
│   ├── event-data-service.ts   # Creates EventData from interaction context
│   ├── http-service.ts         # HTTP client wrapper
│   ├── job-service.ts          # node-schedule wrapper, runs Job[] on cron
│   ├── lang.ts                 # linguini wrapper for i18n
│   ├── logger.ts               # pino logger wrapper
│   ├── master-api-service.ts   # Multi-cluster registration/login
│   └── index.ts
├── triggers/
│   ├── trigger.ts              # Trigger interface (requiresRegex, regex, execute())
│   └── index.ts
├── utils/
│   ├── client-utils.ts         # Client utility methods
│   ├── command-utils.ts        # Command lookup and check execution
│   ├── format-utils.ts         # Date/time formatting
│   ├── interaction-utils.ts    # deferReply, send, edit, etc.
│   ├── math-utils.ts           # Range generation
│   ├── message-utils.ts        # Message utilities
│   ├── partial-utils.ts        # Fetches full objects from partials
│   ├── permission-utils.ts     # Permission checking
│   ├── random-utils.ts         # Random selection
│   ├── regex-utils.ts          # Regex utilities
│   ├── shard-utils.ts          # Shard count calculation, server count
│   ├── string-utils.ts         # String utilities
│   ├── thread-utils.ts         # Thread utilities
│   └── index.ts
├── start-bot.ts                # Shard entry point
└── start-manager.ts            # Manager entry point
```

### Configuration Files

```
config/
├── config.example.json         # Main config (client, api, sharding, clustering, jobs, rateLimiting)
├── debug.example.json          # Debug overrides (dummyMode, shardMode)
└── bot-sites.example.json      # Bot list site URLs for server count posting

lang/
├── lang.common.json            # Shared strings (colors, links, command names)
├── lang.en-GB.json             # English (GB) locale strings
├── lang.en-US.json             # English (US) locale strings
└── logs.json                   # Log message templates
```

---

## 4. Dual Entry Point

The template provides two distinct entry points, each responsible for a different process role.

### `start-manager.ts` — Manager Process

The manager process is the top-level orchestrator. It:

1. **Calculates shard count** — Uses `ShardUtils.recommendedShardCount()` with a configurable `serversPerShard` ratio (default: 1000). For clustering mode, it delegates to a master API.
2. **Creates a `ShardingManager`** — Spawns `start-bot.js` as child processes, one per shard. Configurable `mode` (`process` or `worker`), `respawn: true`, and `totalShards`/`shardList` for clustering support.
3. **Starts scheduled jobs** — `JobService` wraps `node-schedule` to run cron-based tasks (e.g., `UpdateServerCountJob` posts server counts to bot list sites every 10 minutes).
4. **Launches Express API** — Three controllers expose endpoints for guild listing, shard status, and health checks. Protected by bearer token auth middleware.

```typescript
// start-manager.ts (simplified)
let shardManager = new ShardingManager('dist/start-bot.js', {
    token: Config.client.token,
    mode: 'process',
    respawn: true,
    totalShards,
    shardList,
});

let manager = new Manager(shardManager, new JobService(jobs));
let api = new Api([guildsController, shardsController, rootController]);

await manager.start();
await api.start();
```

### `start-bot.ts` — Shard Process

Each shard process:

1. **Creates a `CustomClient`** — Configured with intents, partials, and aggressive cache limits from config.
2. **Registers all handlers** — Commands, buttons, reactions, and triggers are instantiated and injected into their respective handler classes.
3. **Creates a `Bot` instance** — Wires all handlers to discord.js client events.
4. **Optional CLI mode** — If `process.argv[2] == 'commands'`, it enters command registration mode instead of starting the bot.

```typescript
// start-bot.ts (simplified)
let client = new CustomClient({
    intents: Config.client.intents,
    partials: [...],
    makeCache: Options.cacheWithLimits({ ...Config.client.caches }),
});

let commands: Command[] = [new DevCommand(), new HelpCommand(), ...];
let commandHandler = new CommandHandler(commands, eventDataService);
let bot = new Bot(token, client, guildJoinHandler, ..., commandHandler, ...);

// CLI mode or normal start
if (process.argv[2] == 'commands') {
    await commandRegistrationService.process(localCmds, process.argv);
    process.exit();
}
await bot.start();
```

### CLI Sub-Commands

The `start-bot.ts` entry point doubles as a CLI tool for managing Discord application commands:

| Command | npm Script | Action |
|---|---|---|
| `commands view` | `npm run commands:view` | Lists local vs. remote commands (intersection, local-only, remote-only) |
| `commands register` | `npm run commands:register` | Creates new commands and updates existing ones |
| `commands rename` | `npm run commands:rename` | Renames a remote command |
| `commands delete` | `npm run commands:delete` | Deletes a remote command |
| `commands clear` | `npm run commands:clear` | Removes all remote commands |

This is powered by `CommandRegistrationService`, which compares local metadata objects against the Discord API's registered commands and performs the requested action.

### Shard Calculation

```typescript
// Automatic shard calculation
let recommendedShards = await ShardUtils.recommendedShardCount(
    Config.client.token,
    Config.sharding.serversPerShard  // default: 1000
);
```

Discord's gateway recommends a shard count based on guild count. The template divides by `serversPerShard` to determine how many shards to spawn. For clustering (multi-machine), the master API coordinates shard assignment.

---

## 5. Command Pattern

### Command Interface

```typescript
export interface Command {
    names: string[];                    // e.g., ["dev", "view"] for subcommands
    cooldown?: RateLimiter;             // Per-command cooldown
    deferType: CommandDeferType;        // PUBLIC, HIDDEN, or NONE
    requireClientPerms: PermissionsString[];
    autocomplete?(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[]>;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',    // Visible to everyone
    HIDDEN = 'HIDDEN',    // Ephemeral (only visible to user)
    NONE = 'NONE',        // No deferral (respond manually)
}
```

### Key Design Decisions

1. **Multi-level names** — The `names` array supports subcommand groups. `["dev", "view"]` maps to `/dev view`. The `CommandHandler` joins command parts with spaces to look up the handler.

2. **Metadata/execution separation** — Command metadata (name, description, options, permissions, localization) is defined in `metadata.ts` as plain JSON objects, completely separate from the `Command` class that implements `execute()`. This enables:
   - CLI-based registration without loading the full bot
   - Metadata reuse across multiple commands
   - Clean separation of Discord API schema from business logic

3. **Three defer types** — Commands choose how they acknowledge the interaction:
   - `PUBLIC` — Defers publicly (loading spinner visible to all)
   - `HIDDEN` — Defers ephemerally (loading spinner visible only to user)
   - `NONE` — No automatic deferral (command handles its own response timing)

4. **Per-command cooldown** — Each command can optionally define a `RateLimiter` instance for individual cooldown enforcement.

### Command Resolution Flow

```typescript
// CommandHandler.process()
let commandParts = [
    intr.commandName,
    intr.options.getSubcommandGroup(false),
    intr.options.getSubcommand(false),
].filter(Boolean);

let command = CommandUtils.findCommand(this.commands, commandParts);
```

The handler extracts the full command path (including subcommand group and subcommand) and searches the registered commands array for a match.

### Example Command

```typescript
// test-command.ts
export class TestCommand implements Command {
    public names = [Lang.getRef('chatCommands.test', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(
            intr,
            Lang.getEmbed('embeds.test', data.lang)
        );
    }
}
```

---

## 6. Event Handling

### EventHandler Interface

```typescript
export interface EventHandler {
    process(...args: any[]): Promise<void>;
}
```

All event handlers implement this single-method interface. The `Bot` class wires discord.js events to the appropriate handler.

### Handler Types

| Handler | Responsibility | discord.js Event |
|---|---|---|
| `CommandHandler` | Routes slash commands and autocomplete | `InteractionCreate` |
| `ButtonHandler` | Routes button interactions | `InteractionCreate` |
| `TriggerHandler` | Routes message content to triggers | `MessageCreate` (via `MessageHandler`) |
| `ReactionHandler` | Routes message reactions | `MessageReactionAdd` |
| `GuildJoinHandler` | Handles bot joining a guild | `GuildCreate` |
| `GuildLeaveHandler` | Handles bot leaving a guild | `GuildDelete` |
| `MessageHandler` | Delegates to `TriggerHandler` | `MessageCreate` |

### Readiness Guard

The `Bot` class maintains a `ready` flag that prevents event processing until the `ClientReady` event fires:

```typescript
private ready = false;

private async onMessage(msg: Message): Promise<void> {
    if (!this.ready || (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(msg.author.id))) {
        return;
    }
    // ... process message
}
```

This prevents race conditions where events arrive before the bot is fully initialized.

### Partial Handling

Discord.js sends partial objects for some events (e.g., messages from the cache). The template uses `PartialUtils` to fetch full data before processing:

```typescript
msg = await PartialUtils.fillMessage(msg);
if (!msg) return;  // Couldn't fetch full message

msgReaction = await PartialUtils.fillReaction(msgReaction);
reactor = await PartialUtils.fillUser(reactor);
```

### Dummy Mode

A debug configuration allows restricting event processing to a whitelist of user IDs, useful for development:

```json
{
    "dummyMode": {
        "enabled": true,
        "whitelist": ["YOUR_DISCORD_ID"]
    }
}
```

---

## 7. Two-Tier Rate Limiting

The template implements rate limiting at two distinct levels.

### Level 1: Global Handler Rate Limiting

Each handler type (commands, buttons, triggers, reactions) has its own `RateLimiter` instance configured from `config.json`:

```typescript
// CommandHandler
private rateLimiter = new RateLimiter(
    Config.rateLimiting.commands.amount,    // e.g., 10
    Config.rateLimiting.commands.interval * 1000  // e.g., 30s
);

// In process():
let limited = this.rateLimiter.take(intr.user.id);
if (limited) {
    return;  // Silent drop — no response to user
}
```

**Behavior:** When a user exceeds the global limit, the interaction is silently dropped with no response. This prevents abuse without alerting the user.

### Level 2: Per-Command Cooldown

Individual commands can define their own `RateLimiter`:

```typescript
export class SomeCommand implements Command {
    public cooldown = new RateLimiter(3, 10000); // 3 uses per 10 seconds
    // ...
}
```

The `CommandUtils.runChecks()` method evaluates per-command cooldowns and sends an error embed if the user is on cooldown.

### Configuration

```json
{
    "rateLimiting": {
        "commands": { "amount": 10, "interval": 30 },
        "buttons": { "amount": 10, "interval": 30 },
        "triggers": { "amount": 10, "interval": 30 },
        "reactions": { "amount": 10, "interval": 30 }
    }
}
```

Each handler type has independent rate limits, allowing fine-grained control.

---

## 8. Internationalization (i18n)

The template uses the `linguini` library for a structured, three-tier reference system.

### Reference System

| Syntax | Source | Example |
|---|---|---|
| `{{COM:path}}` | `lang/lang.common.json` | `{{COM:colors.default}}` → `#0099ff` |
| `{{REF:path}}` | Current locale file (e.g., `lang.en-US.json`) | `{{REF:chatCommands.test}}` → `test` |
| `{{VARIABLE}}` | Runtime substitution | `{{SERVER_COUNT}}` → `1,234` |

### Locale Files

- `lang/lang.common.json` — Shared strings across all locales (colors, links, command name slugs)
- `lang/lang.en-US.json` — English (US) translations
- `lang/lang.en-GB.json` — English (GB) translations
- `lang/logs.json` — Log message templates (not locale-specific)

### Lang Service

```typescript
export class Lang {
    private static linguini = new Linguini(
        path.resolve(dirname(fileURLToPath(import.meta.url)), '../../lang'),
        'lang'
    );

    // Get a localized embed
    public static getEmbed(location: string, langCode: Locale, variables?: { [name: string]: string }): EmbedBuilder;

    // Get a localized reference string
    public static getRef(location: string, langCode: Locale, variables?: { [name: string]: string }): string;

    // Get a common string (not locale-specific)
    public static getCom(location: string, variables?: { [name: string]: string }): string;

    // Get a localization map for Discord command registration
    public static getRefLocalizationMap(location: string, variables?: { [name: string]: string }): LocalizationMap;
}
```

### Discord Command Localization

Command names and descriptions are registered with localization maps, allowing Discord to display them in the user's preferred language:

```typescript
export const ChatCommandMetadata = {
    TEST: {
        name: Lang.getRef('chatCommands.test', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.test'),
        description: Lang.getRef('commandDescs.test', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.test'),
        // ...
    },
};
```

---

## 9. Express API

The template includes a lightweight Express API for monitoring and management.

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | None | Health check — returns 200 OK |
| `GET` | `/guilds` | Bearer token | Lists all guild IDs across all shards (via `broadcastEval`) |
| `GET` | `/shards` | Bearer token | Returns shard status (ID, status, ping, guild count) |

### Controller Interface

```typescript
export interface Controller {
    path: string;
    router: Router;
    authToken?: string;
    register(): void;
}
```

Each controller defines its own path, router, and optional auth token. The `Api` class registers all controllers with Express and applies auth middleware where configured.

### Guild Broadcast

The `/guilds` endpoint demonstrates cross-shard data aggregation:

```typescript
// GuildsController.getGuilds()
let guilds: string[] = [
    ...new Set(
        (await this.shardManager.broadcastEval(
            client => [...client.guilds.cache.keys()]
        )).flat()
    ),
];
```

This broadcasts a function to all shards, collects guild IDs, and deduplicates them.

### Configuration

```json
{
    "api": {
        "port": 3001,
        "secret": "00000000-0000-0000-0000-000000000000"
    }
}
```

---

## 10. Configuration Management

### Three JSON Configuration Files

| File | Purpose | Gitignored? |
|---|---|---|
| `config.json` | Main config (client, API, sharding, clustering, jobs, rate limiting, logging) | Yes (only `.example.json` committed) |
| `debug.json` | Debug overrides (dummyMode, shardMode) | Yes |
| `bot-sites.json` | Bot list site URLs for server count posting | Yes |

### ESM JSON Loading

Since the project uses ESM modules (`"type": "module"` in `package.json`), JSON files are loaded via `createRequire`:

```typescript
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
```

This is the standard pattern for importing JSON in ESM TypeScript projects.

### Aggressive Cache Limits

The template explicitly zeroes out unused discord.js cache managers to minimize memory:

```json
{
    "client": {
        "caches": {
            "AutoModerationRuleManager": 0,
            "BaseGuildEmojiManager": 0,
            "GuildEmojiManager": 0,
            "GuildBanManager": 0,
            "GuildInviteManager": 0,
            "GuildScheduledEventManager": 0,
            "GuildStickerManager": 0,
            "MessageManager": 0,
            "PresenceManager": 0,
            "StageInstanceManager": 0,
            "ThreadManager": 0,
            "ThreadMemberManager": 0,
            "VoiceStateManager": 0
        }
    }
}
```

These are passed to `Options.cacheWithLimits()` in the `CustomClient` constructor.

### Dummy Mode

For development, dummy mode restricts event processing to whitelisted user IDs and disables scheduled jobs:

```json
{
    "dummyMode": {
        "enabled": true,
        "whitelist": ["YOUR_DISCORD_ID"]
    }
}
```

---

## 11. Deployment

### PM2

The template includes a `process.json` for PM2:

```json
{
    "apps": [
        {
            "name": "my-bot",
            "script": "dist/start-manager.js",
            "node_args": ["--enable-source-maps"],
            "restart_delay": 10000
        }
    ]
}
```

PM2 manages the manager process, which in turn spawns shard processes. The `restart_delay` prevents rapid restart loops.

**npm scripts:**
```bash
npm run start:pm2    # Build + PM2 start
npm run pm2:stop     # PM2 stop
npm run pm2:delete   # PM2 delete
```

### Docker

```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD [ "node", "dist/start-manager.js" ]
```

Port 3001 is exposed for the Express API. The container runs `start-manager.js`, which spawns shard processes internally.

### Scheduled Jobs

Jobs are defined by extending the abstract `Job` class:

```typescript
export abstract class Job {
    abstract name: string;
    abstract log: boolean;
    abstract schedule: string;        // Cron expression
    runOnce = false;
    initialDelaySecs = 0;
    abstract run(): Promise<void>;
}
```

The `JobService` uses `node-schedule` to execute jobs according to their cron expressions:

```typescript
// JobService.start()
for (let job of this.jobs) {
    let jobSchedule = job.runOnce
        ? CronExpressionParser.parse(job.schedule, { currentDate: ... }).next().toDate()
        : { start: DateTime.now().plus({ seconds: job.initialDelaySecs }).toJSDate(), rule: job.schedule };

    schedule.scheduleJob(jobSchedule, async () => {
        await job.run();
    });
}
```

**Built-in job:** `UpdateServerCountJob` runs every 10 minutes (`0 */10 * * * *`), updates the bot's presence with the server count, and posts to configured bot list sites.

---

## 12. nWoD Bot Applicability Assessment

This section evaluates which template patterns are directly applicable to the nWoD Discord bot, with concrete code examples.

### Two-Tier Rate Limiting — Applicable

The nWoD bot currently has no rate limiting. The template's two-tier approach (global handler + per-command cooldown) is a clean, production-proven pattern.

```typescript
// CURRENT nWoD pattern: none

// TEMPLATE-STYLE improvement:
import { RateLimiter } from "discord.js-rate-limiter";

// Global handler rate limiter (in interactionCreate handler)
const globalRateLimiter = new RateLimiter(10, 30000); // 10 per 30s

// Per-command cooldown (in command definition)
export const Roll: Command = {
  name: "roll",
  cooldown: new RateLimiter(3, 10000), // 3 uses per 10s
  // ...
};

// In interactionCreate handler:
if (globalRateLimiter.take(interaction.user.id)) return; // silent drop
if (command.cooldown?.take(interaction.user.id)) {
  await interaction.reply({ content: "Cooldown!", ephemeral: true });
  return;
}
```

**Why applicable:**
- The `discord.js-rate-limiter` package is lightweight and dependency-free
- Global rate limiting prevents abuse without user-facing noise
- Per-command cooldowns allow tuning (e.g., `/roll` can be more permissive than `/admin`)
- Silent drop on global limit is the right UX for a dice roller

### CLI Command Registration — Applicable

The template's `CommandRegistrationService` provides a clean CLI interface for managing Discord application commands. This is directly useful for the nWoD bot.

```typescript
// TEMPLATE-STYLE improvement for nWoD bot:
// Add to package.json scripts:
// "commands:view": "tsx src/scripts/commands.ts view",
// "commands:register": "tsx src/scripts/commands.ts register"

// src/scripts/commands.ts
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";

const action = process.argv[2]; // view, register, delete
const rest = new REST({ version: "10" }).setToken(token);
const remote = await rest.get(Routes.applicationCommands(clientId));

// Compare local Commands[] with remote, show diff, register/update/delete
switch (action) {
  case "view":
    // Show local-only, remote-only, and matching commands
    break;
  case "register":
    // Create new + update existing
    break;
  case "delete":
    // Remove specified command
    break;
  case "clear":
    // Remove all commands
    break;
}
```

**Why applicable:**
- Eliminates manual Discord Developer Portal command management
- Enables CI/CD command registration as part of deployment
- The `view` action is invaluable for debugging command drift between local and remote
- Metadata/execution separation makes this possible without loading the full bot

### Scheduled Jobs — Future Consideration

The template's `Job` abstraction over `node-schedule` is clean but may be overkill for the nWoD bot initially. Consider it when periodic tasks are needed.

```typescript
// Future nWoD use cases:
// - Cache refresh for character data
// - Health check pings
// - Periodic cleanup of temporary data

import schedule from "node-schedule";

// Simple approach (no abstraction needed yet):
schedule.scheduleJob("0 */30 * * * *", async () => {
  // Refresh shared data cache
  await refreshCharacterCache();
});

// If multiple jobs are needed, adopt the template's Job pattern:
abstract class Job {
  abstract name: string;
  abstract schedule: string;
  abstract run(): Promise<void>;
}
```

**Why future consideration:**
- The nWoD bot doesn't currently have periodic tasks
- `node-schedule` is a good choice when the need arises
- The abstract `Job` class is only worth adopting with 2+ jobs

### Express API — Not Applicable (Currently)

The template's Express API serves sharding management and monitoring needs that the nWoD bot doesn't have. If the bot grows to need cross-shard data aggregation or external monitoring, this pattern becomes relevant.

### i18n — Not Applicable (Currently)

The template's `linguini`-based i18n is well-designed but unnecessary for the nWoD bot, which serves an English-speaking community. If localization becomes a requirement, the `{{COM:}}`, `{{REF:}}`, and `{{VARIABLE}}` reference system is worth adopting.

### Aggressive Cache Limits — Applicable

The template's approach to zeroing unused cache managers is a low-effort, high-impact optimization:

```typescript
// nWoD bot improvement:
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    // nWoD doesn't need these:
    GuildEmojiManager: 0,
    GuildBanManager: 0,
    GuildInviteManager: 0,
    GuildStickerManager: 0,
    PresenceManager: 0,
    StageInstanceManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    VoiceStateManager: 0,
  }),
});
```

**Why applicable:**
- Zero cost to implement
- Reduces memory footprint significantly for bots that don't need emoji/ban/invite/presence caching
- Can be tuned incrementally as needs change

### Summary Table

| Pattern | Applicability | Effort | Impact |
|---|---|---|---|
| Two-tier rate limiting | High | Low | High |
| CLI command registration | High | Medium | High |
| Aggressive cache limits | High | Low | Medium |
| Scheduled jobs | Future | Low | Medium |
| Express API | Low | Medium | Low |
| i18n | Low | High | Low |
| Dual entry point (sharding) | Low | High | High |
| Metadata/execution separation | Medium | Medium | Medium |

---

## Appendix: Key Interfaces

### Command

```typescript
interface Command {
    names: string[];
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireClientPerms: PermissionsString[];
    autocomplete?(intr: AutocompleteInteraction, option: AutocompleteFocusedOption): Promise<ApplicationCommandOptionChoiceData[]>;
    execute(intr: CommandInteraction, data: EventData): Promise<void>;
}
```

### EventHandler

```typescript
interface EventHandler {
    process(...args: any[]): Promise<void>;
}
```

### Button

```typescript
interface Button {
    ids: string[];
    deferType: CommandDeferType;
    requireClientPerms: PermissionsString[];
    execute(intr: ButtonInteraction, data: EventData): Promise<void>;
}
```

### Reaction

```typescript
interface Reaction {
    emojis: string[];
    deferType: CommandDeferType;
    requireClientPerms: PermissionsString[];
    execute(msgReaction: MessageReaction, msg: Message, reactor: User, data: EventData): Promise<void>;
}
```

### Trigger

```typescript
interface Trigger {
    requiresRegex: boolean;
    regex?: RegExp;
    execute(msg: Message, data: EventData): Promise<void>;
}
```

### Job

```typescript
abstract class Job {
    abstract name: string;
    abstract log: boolean;
    abstract schedule: string;
    runOnce: boolean;
    initialDelaySecs: number;
    abstract run(): Promise<void>;
}
```

### Controller

```typescript
interface Controller {
    path: string;
    router: Router;
    authToken?: string;
    register(): void;
}
```
