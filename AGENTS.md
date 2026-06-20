# discord-bot — AGENTS.md

## Run

```bash
npm start          # node --import tsx/esm src/Bot.ts
npm run startnot   # tsc && node dist/Bot.js (prod)
```

> **⚠️ DO NOT change `npm start` to bare `tsx src/Bot.ts`.** Pterodactyl's tsx
> defaults to CJS output which does not support top-level `await` (used for
> OTel instrumentation import). The `--import tsx/esm` flag forces ESM mode.
> See the comment at the top of `src/Bot.ts` for details.

Requires Node >=22 and a `.env` file with:

```
DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_LOGGING_CHANNEL_ID, DISCORD_FEEDBACK_CHANNEL_ID
```

## Project structure

- **`src/Bot.ts`** — entry point; loads dotenv, creates `Client` (no intents), registers listeners.
- **`src/listeners/ready.ts`** — registers all slash commands via `client.application.commands.set(Commands)` on startup.
- **`src/Commands.ts`** — central registry; add new commands here.
- **`src/commands/`** — one file per command, exporting a `Command` object (name, description, options, run).
- **`src/AutoCompleteCommands.ts`** — central registry for autocomplete handlers.
- **`src/data/`** — game data providers (spells, merits, rules, tables) and static data files.
- **`src/embedBuilders/`** — discord.js `EmbedBuilder` helpers.
- **`src/buttonInteractions/`** — button interaction handlers (for paginated output).
- **`src/ViewControllers/`** — UI view logic (e.g. table pagination).
- **`src/typescript/BitInt.ts`** — polyfills `BigInt.toJSON`.

## Conventions

- **ESM** (`"type": "module"`) — all local imports end with `.js` extension (e.g. `from "../Command.js"`).
- **TypeScript** — strict mode.
- **No lint/format CI** — match existing style manually.
- **`index.js`** — legacy CJS scratch file, not the real entry point; ignore.
- **`.env`** — committed with real secrets; **do not modify or commit changes to `.env`**.

## Adding a command

1. Create `src/commands/YourCommand.ts` exporting a `Command` object.
2. Import and add it to `src/Commands.ts` array — auto-registers on next bot start.

## Testing

Tests are run with Jest (configured in `jest.config.ts`): `npm test`

Test files live in `src/__tests__/`, mirroring the source structure:
- `src/__tests__/listeners/` — interaction dispatcher and bot lifecycle tests
- `src/__tests__/commands/` — individual command tests
- `src/__tests__/apiClient.test.ts` — API client tests

Run `npm test` to execute all test suites. No lint/format CI in place.
