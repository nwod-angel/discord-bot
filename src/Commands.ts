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
    "description" in mod &&
    "run" in mod &&
    typeof (mod as Command).run === "function"
  );
}

let _commands: Command[] | null = null;

/**
 * Load all command modules from the commands directory.
 * Results are cached after the first call.
 */
export async function loadCommands(): Promise<Command[]> {
  if (_commands === null) {
    _commands = await discoverModules(
      join(__dirname, "commands"),
      isCommand,
      "command",
    );
  }
  return _commands;
}

/**
 * Get the cached commands array. Throws if loadCommands() has not been called yet.
 */
export function getCommands(): Command[] {
  if (_commands === null) {
    throw new Error("Commands not loaded yet. Call loadCommands() first.");
  }
  return _commands;
}
