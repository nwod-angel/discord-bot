import { Client, AutocompleteInteraction, BaseApplicationCommandData, ApplicationCommandOptionChoiceData } from "discord.js";

export interface AutoCompleteCommand extends BaseApplicationCommandData {
    maxResponses: 25
    autocomplete: (client: Client, interaction: AutocompleteInteraction) => ApplicationCommandOptionChoiceData<string | string>[];
}