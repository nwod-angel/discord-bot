import { AutoCompleteCommand } from "./AutoCompleteCommand.js";
import { MeritAutocomplete } from "./autoCompleteCommands/MeritAutoComplete.js";
import { RollAutocomplete } from "./autoCompleteCommands/RollAutocomplete.js";
import { RuleAutocomplete } from "./autoCompleteCommands/RuleAutocomplete.js";
import { SpellAutocomplete } from "./autoCompleteCommands/SpellAutocomplete.js";
import { TableAutocomplete } from "./autoCompleteCommands/TableAutocomplete.js";
import { PostAutocomplete } from "./autoCompleteCommands/PostAutocomplete.js";

export const AutoCompleteCommands: AutoCompleteCommand[] = [
    SpellAutocomplete,
    MeritAutocomplete,
    RuleAutocomplete,
    TableAutocomplete,
    RollAutocomplete,
    PostAutocomplete,
];