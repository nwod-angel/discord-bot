import { AutoCompleteCommand } from "./AutoCompleteCommand.js";
import { MeritAutocomplete } from "./autoCompleteCommands/MeritAutoComplete.js";
import { RuleAutocomplete } from "./autoCompleteCommands/RuleAutocomplete.js";
import { SpellAutocomplete } from "./autoCompleteCommands/SpellAutocomplete.js";

export const AutoCompleteCommands: AutoCompleteCommand[] = [
    SpellAutocomplete,
    MeritAutocomplete,
    RuleAutocomplete
];