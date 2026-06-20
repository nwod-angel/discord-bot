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
    typeof (mod as AutoCompleteCommand).autocomplete === "function" &&
    "maxResponses" in mod &&
    (mod as AutoCompleteCommand).maxResponses === 25
  );
}

let _autoCompleteCommands: AutoCompleteCommand[] | null = null;

/**
 * Load all autocomplete handler modules from the autoCompleteCommands directory.
 * Results are cached after the first call.
 */
export async function loadAutoCompleteCommands(): Promise<AutoCompleteCommand[]> {
  if (_autoCompleteCommands === null) {
    _autoCompleteCommands = await discoverModules(
      join(__dirname, "autoCompleteCommands"),
      isAutoCompleteCommand,
      "autocomplete command",
    );
  }
  return _autoCompleteCommands;
}

/**
 * Get the cached autocomplete commands array. Throws if loadAutoCompleteCommands() has not been called yet.
 */
export function getAutoCompleteCommands(): AutoCompleteCommand[] {
  if (_autoCompleteCommands === null) {
    throw new Error("AutoCompleteCommands not loaded yet. Call loadAutoCompleteCommands() first.");
  }
  return _autoCompleteCommands;
}
