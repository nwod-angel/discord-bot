# EvoBot Architecture Report

> **Repository:** [github.com/eritislami/evobot](https://github.com/eritislami/evobot)
> **Version:** 2.9.0 | **Stars:** 1.9k | **Language:** TypeScript (98.6%)
> **License:** MIT | **Last Updated:** 2026-06-20

---

## 1. Overview

EvoBot is a Discord music bot built with TypeScript and discord.js v14. It supports YouTube playback, playlist handling, queue management, and 28-language localization. The bot uses slash commands exclusively (no message-prefix commands) and provides interactive button controls for media playback.

### Tech Stack

| Component | Technology | Version |
|---|---|---|
| Discord library | discord.js | ^14.15.3 |
| Voice | @discordjs/voice | ^0.17.0 |
| Audio source | play-dl | ^1.9.7 |
| Search | youtube-sr | ~4.3.0 |
| Localization | i18n | ^0.15.1 |
| Runtime | Node.js | >=16.11.0 |
| Build | ts-node / tsc | — |
| Audio codec | ffmpeg-static, @discordjs/opus | — |

### Key Dependencies

```json
{
  "discord.js": "^14.15.3",
  "@discordjs/voice": "^0.17.0",
  "play-dl": "^1.9.7",
  "youtube-sr": "~4.3.0",
  "i18n": "^0.15.1",
  "ffmpeg-static": "^4.4.1",
  "dotenv": "^16.4.5",
  "lyrics-finder": "^21.0.5"
}
```

---

## 2. Architecture Pattern

EvoBot follows a **Singleton God Object** pattern. The `Bot` class is instantiated once in `index.ts` and exported as a module-level constant:

```typescript
// index.ts — the single entry point
import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./structs/Bot";

export const bot = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ]
  })
);
```

Every command and struct that needs shared state imports this singleton directly:

```typescript
import { bot } from "../index";
```

### Characteristics

| Aspect | Pattern |
|---|---|
| Instantiation | Single `Bot` instance created at module load |
| State access | Direct import of `bot` from `"../index"` |
| Dependency injection | None — tight coupling to the singleton |
| Client lifecycle | `Bot` constructor calls `client.login()` immediately |
| Command registration | Happens inside `Bot` constructor on `"ready"` event |
| Interaction routing | Single `InteractionCreate` handler in `Bot` class |

### Trade-offs

- **Pro:** Zero boilerplate — no DI container, no service locator, no factory.
- **Pro:** Simple mental model — one object holds all state.
- **Con:** Untestable in isolation — every module hard-imports `bot`.
- **Con:** Circular dependency risk — `index.ts` imports `Bot`, commands import `index.ts`.
- **Con:** No way to run multiple bot instances or mock the client.

---

## 3. Directory Structure

```
evobot/
├── index.ts                  # Entry point — creates and exports `bot` singleton
├── commands/                 # 20 slash commands, one default export per file
│   ├── play.ts
│   ├── skip.ts
│   ├── stop.ts
│   ├── pause.ts
│   ├── resume.ts
│   ├── loop.ts
│   ├── shuffle.ts
│   ├── queue.ts
│   ├── nowplaying.ts
│   ├── volume.ts
│   ├── lyrics.ts
│   ├── playlist.ts
│   ├── skipto.ts
│   ├── move.ts
│   ├── remove.ts
│   ├── help.ts
│   ├── ping.ts
│   ├── uptime.ts
│   ├── pruning.ts
│   └── search.ts
├── structs/                  # Core domain objects
│   ├── Bot.ts                # Singleton god object — client, commands, queues
│   ├── MusicQueue.ts         # Per-guild audio queue with voice connection
│   ├── Song.ts               # Single track — URL, title, duration, stream
│   └── Playlist.ts           # YouTube playlist wrapper
├── interfaces/               # TypeScript interfaces
│   ├── Command.ts            # Command contract
│   ├── Config.ts             # Config shape
│   └── QueueOptions.ts       # MusicQueue constructor options
├── utils/                    # Shared utilities
│   ├── config.ts             # Two-tier config (config.json → env vars)
│   ├── i18n.ts               # i18n setup with 28 locales
│   ├── checkPermissions.ts   # Bot-permission checker
│   ├── MissingPermissionsException.ts
│   ├── patterns.ts           # URL regex patterns
│   ├── safeReply.ts          # Interaction reply helper
│   └── queue.ts              # canModifyQueue() voice channel check
├── locales/                  # 28 JSON locale files (ar, bg, cs, de, el, en, ...)
├── config.json.example       # Template for local config
├── Dockerfile                # Docker build support
├── package.json              # v2.9.0
└── tsconfig.json
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `index.ts` | Bootstrap — instantiate Client, create Bot, export singleton |
| `structs/` | Domain logic — Bot lifecycle, audio queue management, song resolution |
| `commands/` | Slash command definitions — one file per command, self-contained |
| `interfaces/` | TypeScript contracts — no runtime behavior |
| `utils/` | Cross-cutting concerns — config, i18n, permissions, regex, reply helpers |
| `locales/` | Translation strings — JSON files keyed by dot-notation paths |

---

## 4. Command Pattern

Commands are **plain object literals** (not classes) with a `default` export conforming to the `Command` interface:

### Command Interface

```typescript
// interfaces/Command.ts
import { SlashCommandBuilder } from "discord.js";

export interface Command {
  permissions?: string[];       // Bot-level permissions required
  cooldown?: number;            // Per-user cooldown in seconds
  data: SlashCommandBuilder;    // Self-describing slash command metadata
  execute(...args: any): any;   // Handler function
}
```

### Example: Simple Command

```typescript
// commands/skip.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";
import { safeReply } from "../utils/safeReply";

export default {
  data: new SlashCommandBuilder().setName("skip").setDescription(i18n.__("skip.description")),
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

    if (!queue) return interaction.reply(i18n.__("skip.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(guildMember!)) return i18n.__("common.errorNotChannel");

    queue.player.stop(true);
    safeReply(interaction, i18n.__mf("skip.result", { author: interaction.user.id }));
  }
};
```

### Example: Complex Command with Permissions and Cooldown

```typescript
// commands/play.ts (abbreviated)
export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(i18n.__("play.description"))
    .addStringOption((option) =>
      option.setName("song").setDescription("The song you want to play").setRequired(true)
    ),
  cooldown: 3,  // 3-second per-user cooldown
  permissions: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak],
  async execute(interaction: ChatInputCommandInteraction, input: string) {
    // ... voice channel validation, song resolution, queue management
  }
};
```

### Command Anatomy

| Field | Type | Required | Purpose |
|---|---|---|---|
| `data` | `SlashCommandBuilder` | Yes | Command name, description, options — doubles as registration metadata |
| `execute` | `(...args: any) => any` | Yes | Runtime handler |
| `cooldown` | `number` | No | Per-user cooldown in seconds (default: 1) |
| `permissions` | `string[]` | No | **Bot-level** permissions (not user-level) |

### Key Design Decisions

1. **Plain objects, not classes** — No constructor, no inheritance, no `this` binding. Each command is a self-contained module.
2. **Self-defining metadata** — The `SlashCommandBuilder` in `data` serves as both the command definition and the Discord API registration payload.
3. **Bot-level permissions** — The `permissions` field checks what permissions the *bot* has, not the user. This is a music-bot-specific choice (Connect, Speak).
4. **Loose typing on execute** — `(...args: any): any` loses type safety. Each command knows its own signature but the interface doesn't enforce it.

---

## 5. Command Discovery and Registration

EvoBot uses **filesystem-based auto-discovery** — no manual imports or registration arrays.

### Discovery Flow

```typescript
// Bot.registerSlashCommands() — in structs/Bot.ts
private async registerSlashCommands() {
  const rest = new REST({ version: "9" }).setToken(config.TOKEN);

  // 1. Read all files in commands/ directory
  const commandFiles = readdirSync(join(__dirname, "..", "commands"))
    .filter((file) => !file.endsWith(".map"));

  // 2. Dynamic import each file, extract default export
  for (const file of commandFiles) {
    const command = await import(join(__dirname, "..", "commands", `${file}`));
    this.slashCommands.push(command.default.data);
    this.slashCommandsMap.set(command.default.data.name, command.default);
  }

  // 3. Register globally via REST API
  await rest.put(Routes.applicationCommands(this.client.user!.id), {
    body: this.slashCommands
  });
}
```

### Registration Characteristics

| Aspect | Behavior |
|---|---|
| Discovery method | `readdirSync` on `commands/` directory |
| Filter | Excludes `.map` files only |
| Import method | Dynamic `await import()` |
| Export convention | `command.default` (assumes `export default`) |
| Registration scope | Global (`Routes.applicationCommands`) |
| Error handling | None — malformed files crash the bot |
| Idempotency | Replaces all commands on every restart |

### Adding a New Command

The process is zero-config:

1. Create a `.ts` file in `commands/`
2. Export a default object conforming to `Command` interface
3. Restart the bot

No imports, no arrays, no configuration files to update.

### Risks

- **No validation** — A file exporting `default: "hello"` would silently break.
- **No error boundary** — One bad file prevents all commands from registering.
- **Global registration** — All commands deployed to all guilds (no per-guild scoping).
- **No .map filtering robustness** — Only filters `.map` extension, not other non-command files.

---

## 6. Interaction Routing

All slash command interactions are routed through a single handler in the `Bot` class.

### Routing Flow

```
Discord Gateway
    │
    ▼
Bot.onInteractionCreate()
    │
    ├─ Filter: isChatInputCommand() → return if not
    │
    ├─ Lookup: slashCommandsMap.get(interaction.commandName)
    │
    ├─ Cooldown check (per-user timestamps)
    │
    ├─ Permission check (bot permissions via checkPermissions())
    │
    └─ command.execute(interaction)
```

### Cooldown Enforcement

```typescript
// Simplified from Bot.onInteractionCreate()
if (!this.cooldowns.has(interaction.commandName)) {
  this.cooldowns.set(interaction.commandName, new Collection());
}

const now = Date.now();
const timestamps = this.cooldowns.get(interaction.commandName)!;
const cooldownAmount = (command.cooldown || 1) * 1000;

const timestamp = timestamps.get(interaction.user.id);

if (timestamp) {
  const expirationTime = timestamp + cooldownAmount;
  if (now < expirationTime) {
    const timeLeft = (expirationTime - now) / 1000;
    return interaction.reply({
      content: i18n.__mf("common.cooldownMessage", {
        time: timeLeft.toFixed(1),
        name: interaction.commandName
      }),
      ephemeral: true
    });
  }
}

timestamps.set(interaction.user.id, now);
setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
```

### Permission Check

```typescript
// utils/checkPermissions.ts
export async function checkPermissions(
  command: Command,
  interaction: ChatInputCommandInteraction
): Promise<PermissionResult> {
  const member = await interaction.guild!.members.fetch({
    user: interaction.client.user!.id
  });
  const requiredPermissions = command.permissions as PermissionResolvable[];

  if (!command.permissions) return { result: true, missing: [] };

  const missing = member.permissions.missing(requiredPermissions);
  return { result: !Boolean(missing.length), missing };
}
```

### Important: Button Interactions Are NOT Routed Here

The `onInteractionCreate` handler only processes `ChatInputCommandInteraction`. Button interactions are handled locally by `MusicQueue` via message component collectors (see Section 8).

---

## 7. State Management

All state lives in memory. There is no database, no persistence layer, and no cache.

### State Model

```
bot (Bot singleton)
├── client: Client
├── commands: Collection<string, Command>
├── slashCommands: ApplicationCommandDataResolvable[]
├── slashCommandsMap: Collection<string, Command>
├── cooldowns: Collection<string, Collection<Snowflake, number>>
└── queues: Collection<Snowflake, MusicQueue>      ← per-guild audio state
         │
         └── MusicQueue (one per guild)
             ├── interaction: CommandInteraction
             ├── connection: VoiceConnection
             ├── player: AudioPlayer
             ├── textChannel: TextChannel
             ├── songs: Song[]
             ├── volume: number (default: 100)
             ├── loop: boolean
             ├── muted: boolean
             ├── queueLock: boolean
             └── waitTimeout: NodeJS.Timeout | null
```

### Queue Lifecycle

1. **Create** — First `/play` command in a guild creates a `MusicQueue`, joins voice channel
2. **Enqueue** — Subsequent `/play` commands append songs to `songs[]`
3. **Process** — `processQueue()` plays the next song when the player is idle
4. **Loop** — If `loop` is true, the current song is pushed to the end of `songs[]`
5. **Stop** — Clears songs, stops player, starts `STAY_TIME` disconnect timer
6. **Destroy** — After `STAY_TIME` seconds of inactivity, destroys connection and deletes queue from `bot.queues`

### Queue Lock

The `queueLock` boolean prevents concurrent `processQueue()` calls:

```typescript
public async processQueue(): Promise<void> {
  if (this.queueLock || this.player.state.status !== AudioPlayerStatus.Idle) {
    return;
  }
  if (!this.songs.length) {
    return this.stop();
  }
  this.queueLock = true;
  // ... play next song ...
  finally {
    this.queueLock = false;
  }
}
```

### Persistence

None. Bot restart loses all queues, volumes, loop states, and cooldown timestamps.

---

## 8. Button-Based Controls

When a song starts playing, `MusicQueue` sends a "now playing" message with 8 interactive buttons arranged in two rows.

### Button Layout

| Row 1 | ⏭ Skip | ⏯ Play/Pause | 🔇 Mute | 🔉 Vol- | 🔊 Vol+ |
|---|---|---|---|---|---|
| **Row 2** | 🔁 Loop | 🔀 Shuffle | ⏹ Stop | | |

### Button Handler Architecture

```typescript
// MusicQueue — button handler map
private commandHandlers = new Map([
  ["skip", this.handleSkip],
  ["play_pause", this.handlePlayPause],
  ["mute", this.handleMute],
  ["decrease_volume", this.handleDecreaseVolume],
  ["increase_volume", this.handleIncreaseVolume],
  ["loop", this.handleLoop],
  ["shuffle", this.handleShuffle],
  ["stop", this.handleStop]
]);
```

### Delegation to Slash Commands

Several button handlers delegate directly to the corresponding slash command's `execute()`:

```typescript
private async handleSkip(interaction: ButtonInteraction): Promise<void> {
  await this.bot.slashCommandsMap.get("skip")!.execute(interaction);
}

private async handleLoop(interaction: ButtonInteraction): Promise<void> {
  await this.bot.slashCommandsMap.get("loop")!.execute(interaction);
}

private async handleShuffle(interaction: ButtonInteraction): Promise<void> {
  await this.bot.slashCommandsMap.get("shuffle")!.execute(interaction);
}

private async handleStop(interaction: ButtonInteraction): Promise<void> {
  await this.bot.slashCommandsMap.get("stop")!.execute(interaction);
}
```

Other handlers (mute, volume) implement their logic directly in `MusicQueue` without delegating to commands.

### Component Collector

Buttons are scoped to the current song via a message component collector:

```typescript
private async sendPlayingMessage(newState: AudioPlayerPlayingState) {
  const song = (newState.resource as AudioResource<Song>).metadata;

  const playingMessage = await this.textChannel.send({
    content: song.startMessage(),
    components: this.createButtonRow()
  });

  const filter = (i: Interaction) => i.isButton() && i.message.id === playingMessage.id;

  const collector = playingMessage.createMessageComponentCollector({
    filter,
    time: song.duration > 0 ? song.duration * 1000 : 60000  // scoped to song duration
  });

  collector.on("collect", async (interaction) => {
    if (!interaction.isButton()) return;
    const handler = this.commandHandlers.get(interaction.customId);
    if (["skip", "stop"].includes(interaction.customId)) collector.stop();
    if (handler) await handler.call(this, interaction);
  });

  collector.on("end", () => {
    playingMessage.edit({ components: [] }).catch(console.error);  // remove buttons
    if (config.PRUNING) {
      setTimeout(() => { playingMessage.delete().catch(); }, 3000);
    }
  });
}
```

### Collector Lifecycle

```
Song starts playing
    │
    ▼
sendPlayingMessage() → sends message with 8 buttons
    │
    ▼
createMessageComponentCollector({ time: song.duration * 1000 })
    │
    ├─ "collect" → dispatch to commandHandlers map
    │
    └─ "end" → remove buttons, optionally delete message
```

---

## 9. i18n

EvoBot uses the `i18n` npm package for localization.

### Configuration

```typescript
// utils/i18n.ts
i18n.configure({
  locales: [
    "ar", "bg", "cs", "de", "el", "en", "es", "fa", "fr", "id", "it",
    "ja", "ko", "mi", "nb", "nl", "pl", "pt_br", "ro", "ru", "sv",
    "th", "tr", "uk", "vi", "zh_cn", "zh_sg", "zh_tw"
  ],
  directory: join(__dirname, "..", "locales"),
  defaultLocale: "en",
  retryInDefaultLocale: true,
  objectNotation: true,
  register: global,
  mustacheConfig: {
    tags: ["{{", "}}"],
    disable: false
  }
});

i18n.setLocale(config.LOCALE);
```

### Usage Patterns

```typescript
// Simple key lookup
i18n.__("skip.description")

// Mustache-style interpolation
i18n.__mf("play.startedPlaying", { title: this.title, url: this.url })

// With fallback
i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: interaction.commandName })
```

### Locale File Example

```json
// locales/en.json (partial)
{
  "play": {
    "description": "Play a song from YouTube",
    "errorNotChannel": "You need to join a voice channel first!",
    "startedPlaying": "Now playing: **{{title}}**\n{{url}}",
    "queueAdded": "**{{title}}** has been added to the queue by <@{{author}}>"
  }
}
```

### Characteristics

| Aspect | Behavior |
|---|---|
| Scope | Global — single locale for all guilds |
| Template syntax | Mustache-style `{{variable}}` |
| Fallback | `retryInDefaultLocale: true` — falls back to English |
| Registration | `register: global` — makes `__()` and `__mf()` globally available |
| Missing keys | Returns the key string itself |

---

## 10. Configuration

Two-tier configuration: `config.json` file first, environment variables as fallback.

### Config Interface

```typescript
// interfaces/Config.ts
export interface Config {
  TOKEN: string;
  MAX_PLAYLIST_SIZE: number;
  PRUNING: boolean;
  STAY_TIME: number;
  DEFAULT_VOLUME: number;
  LOCALE: string;
}
```

### Resolution Logic

```typescript
// utils/config.ts
import "dotenv/config";
import { Config } from "../interfaces/Config";

let config: Config;

try {
  config = require("../config.json");       // 1. Try config.json
} catch (error) {
  config = {                                // 2. Fall back to env vars
    TOKEN: process.env.TOKEN || "",
    MAX_PLAYLIST_SIZE: parseInt(process.env.MAX_PLAYLIST_SIZE!) || 10,
    PRUNING: process.env.PRUNING === "true" ? true : false,
    STAY_TIME: parseInt(process.env.STAY_TIME!) || 30,
    DEFAULT_VOLUME: parseInt(process.env.DEFAULT_VOLUME!) || 100,
    LOCALE: process.env.LOCALE || "en"
  };
}

export { config };
```

### Configuration Fields

| Field | Type | Default | Purpose |
|---|---|---|---|
| `TOKEN` | `string` | `""` | Discord bot token |
| `MAX_PLAYLIST_SIZE` | `number` | `10` | Maximum songs imported from a playlist |
| `PRUNING` | `boolean` | `false` | Auto-delete bot messages after songs end |
| `STAY_TIME` | `number` | `30` | Seconds to stay in voice channel after queue ends |
| `DEFAULT_VOLUME` | `number` | `100` | Initial playback volume (0–100) |
| `LOCALE` | `string` | `"en"` | Global locale for i18n |

### Docker Support

Configuration can be provided via environment variables when running in Docker:

```bash
docker run -e "TOKEN=<discord-token>" -e "LOCALE=en" eritislami/evobot
```

---

## 11. Error Handling

EvoBot uses ad-hoc error handling with no centralized strategy.

### Patterns Observed

| Pattern | Example | Location |
|---|---|---|
| `.catch(console.error)` | `interaction.reply(...).catch(console.error)` | Throughout all commands |
| `try/catch` with `console.error` | `try { ... } catch (error) { console.error(error); }` | Bot.ts, MusicQueue.ts |
| Error message string matching | `if (error.message.includes("permissions"))` | Bot.ts interaction handler |
| Silent swallow | `try { this.connection.destroy(); } catch {}` | MusicQueue.ts |
| Infinite retry | `return this.processQueue()` in catch block | MusicQueue.processQueue() |

### MissingPermissionsException

Notably, this class does **not** extend `Error`:

```typescript
// utils/MissingPermissionsException.ts
export class MissingPermissionsException {
  public message = "Missing permissions:";

  constructor(public permissions: string[]) {}

  public toString() {
    return `${this.message} ${this.permissions.join(", ")}`;
  }
}
```

This means `instanceof Error` checks fail, and stack traces are not captured.

### processQueue Retry Loop

The `processQueue` method retries indefinitely on errors:

```typescript
public async processQueue(): Promise<void> {
  // ...
  try {
    const resource = await next.makeResource();
    this.resource = resource!;
    this.player.play(this.resource);
  } catch (error) {
    console.error(error);
    return this.processQueue();  // ← infinite retry, no backoff, no limit
  } finally {
    this.queueLock = false;
  }
}
```

If a song consistently fails to stream (e.g., geo-blocked, removed), this creates an infinite loop.

### Error Handling Summary

- **No centralized error handler** — each module handles (or doesn't handle) errors independently.
- **No structured logging** — all errors go to `console.error`.
- **No user-facing error recovery** — most errors result in ephemeral replies or silent failures.
- **No circuit breakers** — `processQueue` retries forever.
- **No error taxonomy** — all errors treated identically regardless of severity.

---

## 12. nWoD Bot Applicability Assessment

This section evaluates which evobot patterns are worth adopting for the nWoD bot and which should be avoided.

### Pattern Comparison

| Evobot Pattern | nWoD Current | Recommendation |
|---|---|---|
| Filesystem command discovery | Manual imports in `Commands.ts` | **Adopt** — reduces boilerplate |
| Singleton god object | Modular architecture | **Avoid** — DI is better for testing |
| Plain object commands | Class-based commands | **Consider** — lighter weight |
| Button → command delegation | `awaitMessageComponent()` loops | **Keep nWoD** — cleaner for workflows |
| Global i18n | Per-guild locale | **Keep nWoD** — multi-guild support |
| Two-tier config | Config module | **Adopt** — useful for Docker/env flexibility |
| No error handling | Structured error handling | **Keep nWoD** — more robust |

### Filesystem Command Discovery (Applicable)

**Current nWoD pattern** — manual imports in `Commands.ts`:

```typescript
// src/Commands.ts (current nWoD pattern)
import { Hello } from "./commands/Hello.js";
import { Roll } from "./commands/Roll.js";
import { Attack } from "./commands/Attack.js";
import { Paradox } from "./commands/Paradox.js";
// ... every new command requires updating this file

export const Commands: Command[] = [Hello, Roll, Attack, Paradox, ...];
```

**Evobot-style improvement** — filesystem auto-discovery:

```typescript
// src/Commands.ts (evobot-style improvement)
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "./interfaces/Command.js";

export async function loadCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const files = readdirSync(join(__dirname, "commands"))
    .filter(f => f.endsWith(".js") && !f.endsWith(".d.js"));

  for (const file of files) {
    const mod = await import(join(__dirname, "commands", file));
    // Support both named and default exports
    const command = mod.default ?? mod[Object.keys(mod)[0]];
    if (command?.data && command?.execute) {
      commands.push(command);
    }
  }

  return commands;
}
```

**Why this works for nWoD:**
- Eliminates the manual import list — adding a command is zero-config.
- The nWoD bot already uses slash commands with a compatible structure.
- Adds a validation step (`command?.data && command?.execute`) that evobot lacks.

**Migration path:**
1. Ensure all commands export a consistent shape (default export or single named export).
2. Replace the manual array with `loadCommands()`.
3. Add validation to reject malformed command files.

### Button Delegation to Commands (Not Recommended for nWoD)

Evobot's pattern of button handlers calling `command.execute()` directly creates tight coupling:

```typescript
// Evobot pattern — button handler delegates to slash command
private async handleSkip(interaction: ButtonInteraction): Promise<void> {
  await this.bot.slashCommandsMap.get("skip")!.execute(interaction);
}
```

**Problems with this approach:**

1. **Type mismatch** — `ButtonInteraction` is passed where `ChatInputCommandInteraction` is expected. This works at runtime because both share the `Interaction` base, but it breaks type safety.
2. **Tight coupling** — `MusicQueue` must know about the command map, creating a circular dependency chain: `MusicQueue` → `bot` → `slashCommandsMap` → `skip` → `bot.queues`.
3. **No shared context** — Button handlers can't pass queue-specific state to the command (e.g., which song to skip to).
4. **Fragile lookups** — `bot.slashCommandsMap.get("skip")!.execute(...)` uses a non-null assertion on a string key. Typo = runtime crash.

**nWoD's current pattern is cleaner:**

```typescript
// nWoD pattern — awaitMessageComponent() in a loop
// (from /attack and /paradox command workflows)
const response = await interaction.awaitMessageComponent({
  filter: i => i.user.id === interaction.user.id,
  time: 60_000
});

if (response.customId === "hit") {
  await handleAttackRoll(interaction, "hit");
} else if (response.customId === "dodge") {
  await handleDodgeRoll(interaction);
}
```

**Why nWoD's approach is better for interactive workflows:**

| Aspect | Evobot (delegation) | nWoD (awaitMessageComponent) |
|---|---|---|
| Coupling | Button → command map → bot | Self-contained within command |
| Type safety | `ButtonInteraction` cast to `ChatInputCommandInteraction` | Proper `ButtonInteraction` typing |
| State sharing | Via global `bot.queues` | Via closure/local scope |
| Error isolation | Button error crashes command lookup | Error isolated to command scope |
| Readability | Must trace through 3 files | All logic in one place |

**Recommendation:** Keep nWoD's `awaitMessageComponent()` pattern for interactive workflows like `/attack` and `/paradox`. The evobot delegation pattern is an antipattern that only works because evobot's commands are stateless pass-throughs.

### Two-Tier Config (Applicable)

Evobot's config resolution pattern is useful for containerized deployments:

```typescript
// Evobot pattern — config.json first, env vars fallback
let config: Config;
try {
  config = require("../config.json");
} catch (error) {
  config = {
    TOKEN: process.env.TOKEN || "",
    MAX_PLAYLIST_SIZE: parseInt(process.env.MAX_PLAYLIST_SIZE!) || 10,
    // ...
  };
}
```

**nWoD adaptation:**

```typescript
// nWoD could adopt this for environment flexibility
import { readFileSync } from "fs";
import { join } from "path";

function loadConfig(): Config {
  try {
    const raw = readFileSync(join(__dirname, "../../config.json"), "utf-8");
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return {
      token: process.env.DISCORD_TOKEN ?? "",
      guildId: process.env.GUILD_ID ?? "",
      // ... env var fallbacks
    };
  }
}
```

This enables both local development (`config.json`) and cloud deployment (env vars) without code changes.

### Summary

| Pattern | Applicability | Effort | Impact |
|---|---|---|---|
| Filesystem command discovery | High | Low | Eliminates boilerplate on every new command |
| Two-tier config | Medium | Low | Enables Docker/cloud deployment flexibility |
| Plain object commands | Low | Medium | nWoD's class commands are already well-structured |
| Singleton god object | None | — | Would degrade nWoD's testability |
| Button → command delegation | None | — | nWoD's pattern is superior for interactive workflows |
| Global i18n | None | — | nWoD needs per-guild locale support |

---

## Appendix: File Inventory

| File | Lines | Purpose |
|---|---|---|
| `index.ts` | ~20 | Entry point, creates and exports `bot` singleton |
| `structs/Bot.ts` | ~110 | God object — client, command registration, interaction routing |
| `structs/MusicQueue.ts` | ~320 | Per-guild audio queue, voice connection, button controls |
| `structs/Song.ts` | ~70 | Single track — resolution, streaming, metadata |
| `structs/Playlist.ts` | ~40 | YouTube playlist wrapper |
| `interfaces/Command.ts` | ~8 | Command contract |
| `interfaces/Config.ts` | ~8 | Config shape |
| `interfaces/QueueOptions.ts` | ~7 | MusicQueue constructor options |
| `utils/config.ts` | ~17 | Two-tier config resolution |
| `utils/i18n.ts` | ~35 | i18n setup with 28 locales |
| `utils/checkPermissions.ts` | ~18 | Bot permission checker |
| `utils/MissingPermissionsException.ts` | ~10 | Custom exception (not extending Error) |
| `utils/patterns.ts` | ~5 | URL regex patterns |
| `utils/safeReply.ts` | ~12 | Interaction reply helper |
| `utils/queue.ts` | ~4 | Voice channel membership check |
| `commands/*.ts` | ~20 files | One slash command per file |

---

*Report generated from source analysis of [eritislami/evobot](https://github.com/eritislami/evobot) v2.9.0.*
