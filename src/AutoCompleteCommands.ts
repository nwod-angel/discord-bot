import { AutoCompleteCommand } from "./AutoCompleteCommand.js";
import { MeritAutocomplete } from "./autoCompleteCommands/MeritAutoComplete.js";
import { Spell } from "./autoCompleteCommands/Spell.js";

export const AutoCompleteCommands: AutoCompleteCommand[] = [
    Spell,
    MeritAutocomplete
];