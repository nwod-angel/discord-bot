# LavaMusic Architecture Report

> **Repository:** [github.com/bongo-devs/lavamusic](https://github.com/bongo-devs/lavamusic)
> **Version:** v4.7.0 | **Stars:** 721 | **License:** Apache 2.0
> **Language:** TypeScript (98.7%) | **Runtime:** Bun
> **Date:** 2026-06-20

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Architecture Pattern](#2-architecture-pattern)
- [3. Directory Structure](#3-directory-structure)
- [4. Build-Time Registry Generation](#4-build-time-registry-generation-key-pattern)
- [5. Command Pattern](#5-command-pattern)
- [6. Unified Context Abstraction](#6-unified-context-abstraction)
- [7. Component System](#7-component-system)
- [8. Database (Drizzle ORM)](#8-database-drizzle-orm)
- [9. i18n](#9-i18n)
- [10. Environment Validation](#10-environment-validation)
- [11. Cache Optimization](#11-cache-optimization)
- [12. nWoD Bot Applicability Assessment](#12-nwod-bot-applicability-assessment)

---

## 1. Overview

LavaMusic is a high-performance Discord music bot built on discord.js v14 and lavalink-client v2. It provides audio playback from YouTube, Spotify, SoundCloud, and other platforms via Lavalink nodes. The project demonstrates several mature patterns for scaling a Discord bot across multiple guilds.

### Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Bun | Latest |
| Discord API | discord.js | ^14.25.1 |
| Audio | lavalink-client | ^2.9.7 |
| ORM | Drizzle ORM | ^0.45.2 |
| i18n | i18next | ^25.8.13 |
| Validation | Zod | ^4.3.6 |
| Linting | Biome | 2.3.11 |
| Docs | VitePress | ^1.6.4 |

### Key Features

- 12+ audio filters (bass boost, nightcore, karaoke, etc.)
- Per-user playlist system (create, save, edit, share)
- 30+ language support via i18next
- 24/7 voice channel stay mode
- Live lyrics from Genius
- Multi-platform search (YouTube, Spotify, SoundCloud, Apple Music, Deezer)
- DJ role system with permission controls
- Docker-ready deployment

---

## 2. Architecture Pattern

LavaMusic uses a **registry-based modular architecture** built around five pillars: structures, commands, events, components, and database.

### The Lavamusic Class (God Object)

The central `Lavamusic` class extends discord.js `Client` and acts as the application's service locator. It holds:

```typescript
export default class Lavamusic extends Client {
    // Collections for internal state management
    public commands: Collection<string, Command> = new Collection();
    public aliases: Collection<string, string> = new Collection();
    public cooldown: Collection<string, any> = new Collection();
    public components: Collection<string, Component> = new Collection();

    // Database and config
    public db = new ServerData();
    public config = config;
    public readonly emoji = config.emoji;
    public readonly color = config.color;

    // Utilities and Environment
    public utils = Utils;
    public env: typeof env = env;

    // Services
    public topGG!: Api;
    public manager!: LavalinkClient;
    public rest = new REST({ version: "10" }).setToken(env.TOKEN ?? "");
}
```

This is a deliberate design choice: every command, event, and component receives the `client` reference at construction time, giving it access to all services through a single object.

### Five Pillars

| Pillar | Purpose | Location |
|---|---|---|
| **Structures** | Base classes (Command, Event, Component, Context, Lavamusic, LavalinkClient) | `src/structures/` |
| **Commands** | User-facing slash/prefix commands | `src/commands/` |
| **Events** | Discord.js client events, Lavalink player/node events | `src/events/` |
| **Components** | Button/interaction handlers | `src/components/` |
| **Database** | Drizzle ORM with multi-DB provider pattern | `src/database/` |

### Dual-Process Model

LavaMusic uses Discord.js `ShardingManager` for multi-guild scaling:

```typescript
// src/index.ts
if (process.env.SHARDING_MANAGER) {
    // Child process (Shard) — runs the Lavamusic client
    launch().catch((err) => { ... });
} else {
    // Main process (Manager) — spawns shards
    start();
}
```

The `ShardingManager` spawns shard instances with `totalShards: "auto"` (Discord recommends shard count based on guild count). Each shard runs its own `Lavamusic` client instance.

---

## 3. Directory Structure

```
src/
├── commands/                  # Organized by category
│   ├── config/                # Guild configuration commands
│   ├── dev/                   # Developer-only commands
│   ├── filters/               # Audio filter commands
│   ├── info/                  # Informational commands
│   ├── music/                 # Music playback commands
│   └── playlist/              # Playlist management commands
├── events/                    # Three types: client, player, node
│   ├── client/                # Discord.js events (Ready, InteractionCreate, etc.)
│   ├── player/                # Lavalink player events (trackStart, trackEnd, etc.)
│   └── node/                  # Lavalink node events (connect, disconnect, etc.)
├── components/                # Player button handlers
│   ├── Forward.ts
│   ├── Loop.ts
│   ├── Previous.ts
│   ├── Resume.ts
│   └── ...
├── database/                  # Drizzle ORM with multi-DB support
│   ├── factory.ts             # Database provider factory
│   ├── provider/              # PostgresProvider, SQLiteProvider
│   ├── schemas/               # Drizzle table definitions
│   ├── types.ts               # IDatabaseProvider interface
│   └── server.ts              # ServerData facade
├── structures/                # Core base classes
│   ├── Lavamusic.ts           # Main client class
│   ├── Command.ts             # Command base class
│   ├── Context.ts             # Unified interaction/message wrapper
│   ├── Event.ts               # Event base class
│   ├── Component.ts           # Component base class
│   ├── LavalinkClient.ts      # Lavalink manager wrapper
│   └── I18n.ts                # i18next setup + proxy accessor
├── utils/                     # Utility functions
│   ├── functions/             # Player helpers, etc.
│   ├── Permissions.ts         # Permission constants
│   └── Utils.ts               # General utilities
├── types/                     # TypeScript type definitions
├── @types/                    # Ambient type declarations
├── env.ts                     # Zod environment validation
├── config.ts                  # Static config (colors, emojis, links)
├── LavaClient.ts              # Client bootstrap
├── shard.ts                   # ShardingManager setup
└── index.ts                   # Entry point (manager vs shard detection)

scripts/
├── generate-registry.ts       # Build-time code generation
├── build.ts                   # Build script
└── sync-locales.ts            # i18n sync utility

locales/                       # 30+ language directories
├── EnglishUS/
│   ├── buttons.json
│   ├── commands.json
│   ├── common.json
│   ├── dev.json
│   ├── events.json
│   └── player.json
├── SpanishES/
├── FrenchFR/
└── ...

drizzle/                       # Migration files per dialect
├── migrations/                # PostgreSQL migrations
└── migrations.sqlite/         # SQLite migrations
```

---

## 4. Build-Time Registry Generation (KEY PATTERN)

This is LavaMusic's most distinctive architectural pattern. Rather than manually maintaining import lists, a build script scans the filesystem and generates barrel files automatically.

### How It Works

The `scripts/generate-registry.ts` script:

1. Scans `src/commands/**/*.ts`, `src/events/**/*.ts`, and `src/components/**/*.ts`
2. Filters out test files (`.test.ts`, `.spec.ts`), declaration files (`.d.ts`), and existing `index.ts` files
3. Generates an `index.ts` barrel file in each directory with a typed array export
4. Runs as a `prebuild` and `predev` npm script — always executed before build or dev

### Registry Configuration

```typescript
const REGISTRY_CONFIG = {
    commands: {
        path: join(SRC_DIR, "commands"),
        exportName: "CommandList",
    },
    events: {
        path: join(SRC_DIR, "events"),
        exportName: "EventList",
    },
    components: {
        path: join(SRC_DIR, "components"),
        exportName: "ComponentList",
    },
} as const;
```

### Key Implementation Details

**Name Collision Resolution:**
```typescript
let finalName = varName;
let counter = 1;
while (usedNames.has(finalName)) {
    finalName = `${varName}${counter}`;
    counter++;
}
usedNames.add(finalName);
```

**Windows Path Normalization:**
```typescript
const importPath = `./${relative(dir, file).replace(/\\/g, "/").replace(/\.ts$/, "")}`;
```

**Generated Output Example:**
```typescript
// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Run: bun run scripts/generate-registry.ts
// biome-ignore-all lint: generated file

import Play from "./music/Play.js";
import Skip from "./music/Skip.js";
import Pause from "./music/Pause.js";

export const CommandList = [
    Pause,
    Play,
    Skip,
];
```

### Usage in Lavamusic.start()

```typescript
public async loadCommands(): Promise<void> {
    this.commands.clear();
    this.aliases.clear();
    this.body = [];

    for (const CommandClass of CommandList) {
        const command = new (CommandClass as any)(this, CommandClass.name);
        if (!command.category) command.category = "general";
        this.commands.set(command.name, command);

        for (const alias of command.aliases) {
            this.aliases.set(alias, command.name);
        }

        if (command.slashCommand) {
            this.body.push(this.prepareCommandData(command));
        }
    }
}
```

### Benefits

- **Zero boilerplate** — add a new command file, it's automatically registered
- **No import maintenance** — the generator handles all imports
- **Deterministic ordering** — files are sorted alphabetically
- **Cross-platform** — Windows backslash paths are normalized to POSIX imports

---

## 5. Command Pattern

Commands extend the `Command` base class and declare their configuration via a declarative options object.

### Command Base Class

```typescript
export default class Command {
    public client: Lavamusic;
    public name: string;
    public description: CommandDescription;
    public aliases: string[];
    public cooldown: number;
    public args: boolean;
    public vote: boolean;
    public player: CommandPlayer;
    public permissions: CommandPermissions;
    public slashCommand: boolean;
    public options: APIApplicationCommandOption[];
    public category: string;

    constructor(client: Lavamusic, options: CommandOptions) { ... }

    public async run(_client: Lavamusic, _message: any, _args: string[]): Promise<any> {
        return await Promise.resolve();
    }
    public async autocomplete(_interaction: AutocompleteInteraction): Promise<void> {
        return await Promise.resolve();
    }
}
```

### Declarative Configuration

Each command declares everything about itself in the constructor:

```typescript
export default class Play extends Command {
    constructor(client: Lavamusic) {
        super(client, {
            name: "play",
            description: {
                content: I18N.commands.play.description,
                examples: ["play example", "play https://youtube.com/..."],
                usage: "play <song>",
            },
            category: "music",
            aliases: ["p"],
            cooldown: 3,
            args: true,
            vote: false,
            player: {
                voice: true,    // User must be in a voice channel
                dj: false,      // No DJ role required
                active: false,  // Player doesn't need to be active
                djPerm: null,
            },
            permissions: {
                dev: false,
                client: [SendMessages, ReadMessageHistory, ViewChannel, EmbedLinks, Connect, Speak],
                user: [],
            },
            slashCommand: true,
            options: [
                {
                    name: "song",
                    description: t(I18N.commands.play.options.song),
                    type: 3, // STRING
                    required: true,
                    autocomplete: true,
                },
            ],
        });
    }
}
```

### Convention-Based Validation

The `player` and `permissions` objects enable convention-based validation. Before a command's `run()` method executes, the event handler checks:

- `player.voice` — Is the user in a voice channel?
- `player.dj` — Does the user have the DJ role?
- `player.active` — Is there an active player in the guild?
- `permissions.dev` — Is the user a bot developer?
- `permissions.user` / `permissions.client` — Do the required permissions exist?

This moves validation logic out of individual commands and into the framework.

---

## 6. Unified Context Abstraction

The `Context` class is a polymorphic wrapper that lets the same command code work with both `ChatInputCommandInteraction` (slash commands) and `Message` (prefix commands).

### Context Class

```typescript
export default class Context {
    public ctx: ChatInputCommandInteraction | Message;
    public interaction: ChatInputCommandInteraction | null;
    public message: Message | null;
    public client: Lavamusic;
    public author: User | null;
    public channel: TextBasedChannel;
    public guild: Guild;
    public member: GuildMemberResolvable | GuildMember | APIInteractionGuildMember | null;
    public args: any[];
    public guildLocale: string | undefined;

    constructor(ctx: ChatInputCommandInteraction | Message, args: any[]) {
        this.ctx = ctx;
        this.interaction = ctx instanceof ChatInputCommandInteraction ? ctx : null;
        this.message = ctx instanceof Message ? ctx : null;
        // ... normalize common properties
    }
}
```

### Polymorphic Methods

```typescript
// Discriminator
public get isInteraction(): boolean {
    return this.ctx instanceof ChatInputCommandInteraction;
}

// Send a message (routes to interaction.reply or channel.send)
public async sendMessage(content: string | MessagePayload | ...): Promise<Message> {
    if (this.isInteraction) {
        this.msg = await this.interaction?.reply(content);
    } else {
        this.msg = await (this.message?.channel as TextChannel).send(content);
    }
    return this.msg;
}

// Edit a message (routes to interaction.editReply or msg.edit)
public async editMessage(content: string | ...): Promise<Message> { ... }

// Defer (routes to interaction.deferReply or channel.send)
public async sendDeferMessage(content: string | ...): Promise<Message> { ... }

// Per-guild translation
public locale(key: any, params: Record<string, any> = {}): string {
    const lng = this.guildLocale || env.DEFAULT_LANGUAGE || Locale.EnglishUS;
    return t(String(key), { lng, ...params });
}
```

### Options Helper

```typescript
options = {
    getRole: (name: string, required = true) => this.interaction?.options.get(name, required)?.role,
    getMember: (name: string, required = true) => this.interaction?.options.get(name, required)?.member,
    getChannel: (name: string, required = true) => this.interaction?.options.get(name, required)?.channel,
    getSubCommand: () => this.interaction?.options.data[0].name,
};
```

This abstraction means commands don't need to know whether they were invoked via slash command or prefix message.

---

## 7. Component System

Components handle Discord interactions that aren't commands — primarily button clicks on the music player embed.

### Component Base Class

```typescript
export default class Component {
    public client: Lavamusic;
    public name: string;
    public aliases: string[];

    constructor(client: Lavamusic, options: ComponentOptions) {
        this.client = client;
        this.name = options.name;
        this.aliases = options.aliases ?? [];
    }

    public async run(
        _interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction,
    ): Promise<any> {
        return await Promise.resolve();
    }
}
```

### Registration and Routing

Components are registered via the same build-time registry as commands. In the `InteractionCreate` event:

```typescript
// Pseudocode for component routing
if (interaction.isButton()) {
    const component = client.components.get(interaction.customId);
    if (component) {
        await component.run(interaction);
    }
}
```

### Player Button Examples

| Component | Custom ID | Purpose |
|---|---|---|
| `Resume` | `resume` | Toggle play/pause |
| `Skip` | `skip` | Skip current track |
| `Loop` | `loop` | Toggle loop mode |
| `Previous` | `previous` | Play previous track |
| `Forward` | `forward` | Seek forward |
| `Rewind` | `rewind` | Seek backward |
| `Shuffle` | `shuffle` | Shuffle queue |
| `Stop` | `stop` | Stop playback |

---

## 8. Database (Drizzle ORM)

LavaMusic uses a **Repository Pattern** with Drizzle ORM, supporting three database backends.

### Database Type Detection

```typescript
export function detectDatabaseType(url?: string): DatabaseType {
    if (!url) return DatabaseType.PGLite;  // Default to embedded
    if (url.startsWith("postgres://") || url.startsWith("postgresql://"))
        return DatabaseType.Postgres;
    if (url.startsWith("sqlite:") || url.endsWith(".db") || url.endsWith(".sqlite"))
        return DatabaseType.SQLite;
    return DatabaseType.PGLite;
}
```

### Provider Interface

```typescript
interface IDatabaseProvider {
    guilds: IGuildRepository;
    setups: ISetupRepository;
    stays: IStayRepository;
    djs: IDjRepository;
    roles: IRoleRepository;
    playlists: IPlaylistRepository;
}
```

### Concrete Implementations

| Provider | Backend | Drizzle Driver |
|---|---|---|
| `PostgresProvider` | PostgreSQL or PGLite | `drizzle-orm/node-postgres` or `drizzle-orm/pglite` |
| `SQLiteProvider` | SQLite (Bun built-in) | `drizzle-orm/bun-sqlite` |

### ServerData Facade

The `ServerData` class wraps the provider and provides a backward-compatible API:

```typescript
export default class ServerData {
    private provider: IDatabaseProvider | null = null;

    private async getProvider(): Promise<IDatabaseProvider> {
        if (!this.provider) {
            this.provider = await getDatabase();
        }
        return this.provider;
    }

    public async get(guildId: string) {
        const provider = await this.getProvider();
        return provider.guilds.get(guildId);
    }

    public async setPrefix(guildId: string, prefix: string) { ... }
    public async getLanguage(guildId: string) { ... }
    public async set_247(guildId: string, textId: string, voiceId: string) { ... }
    public async getPlaylist(userId: string, name: string) { ... }
    // ... 20+ methods
}
```

### Schema Tables

| Table | Purpose |
|---|---|
| `Bot` | Global bot settings |
| `Guild` | Per-guild config (prefix, language, volume) |
| `Stay` | 24/7 voice channel stay settings |
| `Dj` | DJ mode toggle per guild |
| `Role` | DJ role assignments per guild |
| `Playlist` | User playlists |
| `Setup` | Request channel setup per guild |

### Migration Strategy

Drizzle generates separate migration files per dialect:

```bash
# PostgreSQL
bun run db:generate   # Generate migration
bun run db:push       # Apply migration

# SQLite
bun run db:generate:sqlite
bun run db:push:sqlite
```

---

## 9. i18n

LavaMusic supports 30+ languages via i18next with a sophisticated type-safe accessor pattern.

### Initialization

```typescript
export async function initI18n() {
    const languages = readdirSync(LOCALES_PATH).filter((lang) => {
        const fullPath = join(LOCALES_PATH, lang);
        return lstatSync(fullPath).isDirectory() && !lang.startsWith(".");
    });

    await i18next.init({
        fallbackLng: Locale.EnglishUS,
        supportedLngs: languages,
        interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
        nsSeparator: ":",
        keySeparator: ".",
    });

    for (const locale of languages) {
        const files = readdirSync(join(LOCALES_PATH, locale)).filter(f => f.endsWith(".json"));
        for (const file of files) {
            const namespace = parse(file).name;
            const content = JSON.parse(readFileSync(join(LOCALES_PATH, locale, file), "utf8"));
            i18next.addResourceBundle(locale, namespace, content, true, true);
        }
    }
}
```

### Namespace Structure

Each locale directory contains namespace files:

```
locales/EnglishUS/
├── buttons.json     # Button labels
├── commands.json    # Command descriptions, options, messages
├── common.json      # Shared strings
├── dev.json         # Developer command strings
├── events.json      # Event messages
└── player.json      # Player-related messages
```

### Type-Safe Proxy Accessor

The `I18N` object uses a recursive `Proxy` to convert property access into i18next paths:

```typescript
const createProxy = (path: string[] = []): any =>
    new Proxy(() => {}, {
        get: (_, prop) => {
            if (prop === "toString" || prop === Symbol.toPrimitive) return () => buildPath(path);
            if (typeof prop !== "string" || prop === "then") return undefined;
            return createProxy([...path, prop]);
        },
        apply: () => buildPath(path),
    });

export const I18N = createProxy() as I18nResourceSchema;
```

**Usage:**
```typescript
I18N.commands.play.description  // → "commands:play.description"
I18N.commands.play.options.song // → "commands:play.options.song"
```

### Discord Localization API Integration

The `resolveLocalizations()` function generates `name_localizations` and `description_localizations` for Discord's slash command API:

```typescript
export function resolveLocalizations(key: any, type: LocaleSubKeys): LocalizationMap {
    const map: LocalizationMap = {};
    for (const lang of getSupportedLanguages()) {
        const translated = t(basePath, { lng: lang });
        if (isNameType) {
            map[lng] = translated.toLowerCase().replace(/\s+/g, "-").slice(0, 32);
        } else {
            map[lng] = translated.trim().slice(0, 100);
        }
    }
    return map;
}
```

### Per-Guild Language

Each guild's language preference is stored in the database and resolved in the `Context` constructor:

```typescript
private async setUpLocale(): Promise<void> {
    this.guildLocale = this.guild
        ? await this.client.db.getLanguage(this.guild.id)
        : env.DEFAULT_LANGUAGE || Locale.EnglishUS;
}
```

### Custom Interpolation

LavaMusic uses `{variable}` syntax instead of i18next's default `{{variable}}`:

```typescript
interpolation: { escapeValue: false, prefix: "{", suffix: "}" }
```

Usage in locale files:
```json
{
    "added_to_queue": "Added **{title}** to the queue."
}
```

---

## 10. Environment Validation

LavaMusic uses Zod for type-safe environment variable validation with automatic coercion.

### Schema Definition

```typescript
const envSchema = z.object({
    TOKEN: z.string(),
    CLIENT_ID: z.string(),
    DEFAULT_LANGUAGE: z.string().default("EnglishUS"),
    PREFIX: z.string().default("!"),
    OWNER_IDS: z.preprocess(
        (val) => (typeof val === "string" ? JSON.parse(val) : val),
        z.string().array().optional(),
    ),
    GUILD_ID: z.string().optional(),
    TOPGG: z.string().optional(),
    KEEP_ALIVE: z.preprocess((val) => val === "true", z.boolean().default(false)),
    BOT_STATUS: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase() : val,
        z.enum(["online", "idle", "dnd", "invisible"]).default("online"),
    ),
    BOT_ACTIVITY_TYPE: z.preprocess((val) => {
        if (typeof val === "string") return Number.parseInt(val, 10);
        return val;
    }, z.number().default(0)),
    DATABASE_URL: z.string().optional(),
    SEARCH_ENGINE: z.preprocess(
        (val) => typeof val === "string" ? val.toLowerCase() : val,
        z.enum(["youtube", "youtubemusic", "soundcloud", "spotify", "apple", "deezer", "yandex", "jiosaavn"])
            .default("youtube"),
    ),
    NODES: z.preprocess(
        (val) => (typeof val === "string" ? JSON.parse(val) : val),
        z.array(LavalinkNodeSchema),
    ),
    GENIUS_API: z.string().optional(),
});

export const env: Env = envSchema.parse(process.env);
```

### Key Patterns

| Pattern | Purpose | Example |
|---|---|---|
| `z.preprocess` | Type coercion from env strings | `"true"` → `true`, `"42"` → `42` |
| `JSON.parse` in preprocess | Parse JSON arrays from env | `OWNER_IDS='["id1","id2"]'` → `string[]` |
| `.default()` | Sensible defaults | `PREFIX` defaults to `"!"` |
| `.optional()` | Optional vars | `DATABASE_URL` not required (defaults to PGLite) |
| `.enum()` | Constrained values | `BOT_STATUS` must be one of `online`, `idle`, `dnd`, `invisible` |

---

## 11. Cache Optimization

LavaMusic aggressively limits Discord.js cache sizes to reduce memory usage across hundreds of guilds.

### Cache Configuration

```typescript
// In Lavamusic constructor or client options
makeCache: Options.cacheWithLimits({
    MessageManager: 0,        // No message cache
    ThreadManager: 0,         // No thread cache
    GuildMemberManager: {
        maxSize: 10,          // Only cache 10 members per guild
    },
    // Other managers use defaults
}),
sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: {
        interval: 3600,       // Sweep every hour
        lifetime: 1800,       // Messages older than 30 min
    },
},
```

### Why This Matters

For a music bot serving hundreds of guilds:
- `MessageManager: 0` — Messages are ephemeral; the bot only needs the current interaction
- `ThreadManager: 0` — Threads are not used
- `GuildMemberManager: maxSize: 10` — Only cache members who recently interacted
- Hourly sweepers prevent memory leaks

This is critical for multi-guild scaling where memory usage grows linearly with guild count.

---

## 12. nWoD Bot Applicability Assessment

This section evaluates which LavaMusic patterns are applicable to the nWoD (New World of Darkness) Discord bot.

### Build-Time Registry Generation (HIGHLY APPLICABLE)

**Current nWoD pattern (manual):**
```typescript
// src/commands/index.ts — manually maintained
import { Hello } from "./Hello.js";
import { Roll } from "./Roll.js";
import { Goodbye } from "./Goodbye.js";

export const Commands: Command[] = [Hello, Roll, Goodbye, ...];
```

**LavaMusic-style improvement:**
```typescript
// scripts/generate-registry.ts
import { readdirSync, statSync, writeFileSync } from "fs";
import { join, parse, relative } from "path";

const SRC_DIR = join(process.cwd(), "src", "commands");
const IGNORED_EXTENSIONS = [".d.ts", ".test.ts", ".spec.ts", ".map"];
const IGNORED_FILES = ["index.ts"];

function scanCommands(dir: string): string[] {
    const commands: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            commands.push(...scanCommands(fullPath));
        } else if (
            entry.name.endsWith(".ts") &&
            !IGNORED_FILES.includes(entry.name) &&
            !IGNORED_EXTENSIONS.some(ext => entry.name.endsWith(ext))
        ) {
            commands.push(fullPath);
        }
    }
    return commands;
}

const files = scanCommands(SRC_DIR).sort();
const usedNames = new Set<string>();

const imports = files.map(file => {
    let varName = parse(file).name.replace(/[^a-zA-Z0-9]/g, "");
    if (/^[0-9]/.test(varName)) varName = `_${varName}`;
    let finalName = varName;
    let counter = 1;
    while (usedNames.has(finalName)) { finalName = `${varName}${counter++}`; }
    usedNames.add(finalName);

    const importPath = `./${relative(SRC_DIR, file).replace(/\\/g, "/").replace(/\.ts$/, "")}`;
    return `import ${finalName} from "${importPath}.js";`;
}).join("\n");

const exports = `export const Commands: Command[] = [\n${[...usedNames].map(n => `    ${n},`).join("\n")}\n];`;

writeFileSync(join(SRC_DIR, "index.ts"),
    `// AUTO-GENERATED — do not edit\n${imports}\n\n${exports}\n`
);
console.log(`Generated command registry with ${files.length} entries.`);
```

**Benefit:** Add a new command file → it's automatically registered. No import maintenance.

---

### Zod Environment Validation (HIGHLY APPLICABLE)

**Current nWoD pattern:**
```typescript
// Raw process.env reads with manual defaults
const token = process.env.DISCORD_TOKEN ?? "";
const clientId = process.env.DISCORD_CLIENT_ID ?? "";
const useApiRoll = process.env.USE_API_ROLL === "true";
const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
```

**LavaMusic-style improvement:**
```typescript
// src/env.ts
import { z } from "zod";

const envSchema = z.object({
    DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
    DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
    USE_API_ROLL: z.preprocess(
        (val) => val === "true",
        z.boolean().default(false),
    ),
    API_BASE_URL: z.string().url().default("http://localhost:3001"),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
    DATABASE_URL: z.string().optional(),
    OWNER_IDS: z.preprocess(
        (val) => typeof val === "string" ? JSON.parse(val) : val,
        z.string().array().optional(),
    ),
});

export const env = envSchema.parse(process.env);
```

**Benefits:**
- Fail-fast on missing required variables (startup error, not runtime)
- Type coercion from env strings to proper types
- Sensible defaults for optional values
- Single source of truth for environment configuration

---

### Unified Context Abstraction (MODERATELY APPLICABLE)

If the nWoD bot ever supports both slash commands and prefix messages, the Context pattern is valuable:

```typescript
// Wraps both interaction and message into a uniform API
export default class Context {
    public ctx: ChatInputCommandInteraction | Message;
    public get isInteraction(): boolean { ... }

    public async sendMessage(content: string): Promise<Message> {
        if (this.isInteraction) return this.interaction!.reply(content);
        return this.message!.channel.send(content);
    }

    public locale(key: string, params?: Record<string, any>): string {
        return t(key, { lng: this.guildLocale, ...params });
    }
}
```

For a slash-command-only bot, this adds unnecessary indirection. But if prefix support is planned, it's a clean abstraction.

---

### Component System (LOW APPLICABILITY)

The component system is specific to interactive music player buttons. The nWoD bot likely doesn't need persistent button panels, but if interactive character sheets or dice rollers with buttons are planned, the pattern is reusable.

---

### Database Provider Pattern (MODERATELY APPLICABILITY)

If the nWoD bot needs to support multiple database backends (e.g., SQLite for local dev, PostgreSQL for production), the provider pattern is clean:

```typescript
interface IDatabaseProvider {
    characters: ICharacterRepository;
    sessions: ISessionRepository;
    // ...
}

class SQLiteProvider implements IDatabaseProvider { ... }
class PostgresProvider implements IDatabaseProvider { ... }
```

For a single-database bot, Drizzle ORM alone (without the provider abstraction) is sufficient.

---

### Summary Matrix

| Pattern | Applicability | Effort | Impact |
|---|---|---|---|
| Build-time registry generation | **High** | Low | Eliminates manual import maintenance |
| Zod environment validation | **High** | Low | Fail-fast, type-safe config |
| Unified Context abstraction | Medium | Medium | Future-proofs for prefix support |
| Database provider pattern | Medium | Medium | Enables multi-DB support |
| Component system | Low | Low | Only if interactive UIs needed |
| Cache optimization | Low | Low | nWoD bot unlikely to hit cache limits |
| ShardingManager | Low | Medium | Only at significant scale |
| i18n proxy accessor | Low | High | Only if multi-language needed |

---

*Report generated from analysis of [bongo-devs/lavamusic](https://github.com/bongo-devs/lavamusic) v4.7.0.*
