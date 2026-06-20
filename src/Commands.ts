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

export const Commands: Command[] = await discoverModules(
  join(__dirname, "commands"),
  isCommand,
  "command",
);
