# discord-bot — AGENTS.md

## Run

```bash
npm start          # tsx src/Bot.ts (dev)
npm run startnot   # tsc && node dist/Bot.js (prod)
```

Requires Node >=22 and a `.env` file with:

```
DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_LOGGING_CHANNEL_ID, DISCORD_FEEDBACK_CHANNEL_ID
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PSWD, DB_LOGGING
```

## Project structure

- **`src/Bot.ts`** — entry point; loads dotenv, creates `Client` (no intents), registers listeners.
- **`src/listeners/ready.ts`** — registers all slash commands via `client.application.commands.set(Commands)` on startup.
- **`src/Commands.ts`** — central registry; add new commands here.
- **`src/commands/`** — one file per command, exporting a `Command` object (name, description, options, run).
- **`src/AutoCompleteCommands.ts`** — central registry for autocomplete handlers.
- **`src/data/`** — game data providers (spells, merits, rules, tables) and static data files.
- **`src/mysql/`** — TypeORM DataSource (`synchronize: true`) + `DiscordBotDao` + entity `SavedRoll`.
- **`src/embedBuilders/`** — discord.js `EmbedBuilder` helpers.
- **`src/buttonInteractions/`** — button interaction handlers (for paginated output).
- **`src/ViewControllers/`** — UI view logic (e.g. table pagination).
- **`src/typescript/BitInt.ts`** — polyfills `BigInt.toJSON`.

## Conventions

- **ESM** (`"type": "module"`) — all local imports end with `.js` extension (e.g. `from "../Command.js"`).
- **TypeScript** — strict mode, decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`).
- **TypeORM** — `synchronize: true` creates/alters tables on app start; no migration workflow.
- **No lint/format CI** — match existing style manually.
- **`index.js`** — legacy CJS scratch file, not the real entry point; ignore.
- **`.env`** — committed with real secrets; **do not modify or commit changes to `.env`**.

## Adding a command

1. Create `src/commands/YourCommand.ts` exporting a `Command` object.
2. Import and add it to `src/Commands.ts` array — auto-registers on next bot start.

## Testing

`npm test` lists `jest` but no jest config or test files exist. Tests are not wired up.
