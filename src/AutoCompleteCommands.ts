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

export const AutoCompleteCommands: AutoCompleteCommand[] = await discoverModules(
  join(__dirname, "autoCompleteCommands"),
  isAutoCompleteCommand,
  "autocomplete command",
);
