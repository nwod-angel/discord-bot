import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { Roll } from "../commands/Roll.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import { fetchCharacterNames } from "../apiClient.js";

export const RollAutocomplete: AutoCompleteCommand = {
    name: Roll.name,
    maxResponses: 25,
    autocomplete: async function (client: Client<boolean>, interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData<string | string>[]> {
        try {
            const focusedValue = interaction.options.getFocused().toString();
            const userId = interaction.user.id;
            const names = await fetchCharacterNames(userId);
            return names
                .filter(name => name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, this.maxResponses)
                .map(name => ({ name, value: name }));
        } catch {
            return [];
        }
    }
};
