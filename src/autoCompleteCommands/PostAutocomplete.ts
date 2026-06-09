import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { Post } from "../commands/Post.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import { fetchCharacterAutocomplete } from "../apiClient.js";

export const PostAutocomplete: AutoCompleteCommand = {
    name: Post.name,
    maxResponses: 25,
    autocomplete: async function (client: Client<boolean>, interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData<string | string>[]> {
        try {
            const focusedValue = interaction.options.getFocused().toString();
            const userId = interaction.user.id;
            const characters = await fetchCharacterAutocomplete(userId);
            return characters
                .filter(c => c.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, this.maxResponses)
                .map(c => ({
                    name: c.concept ? `${c.name} <${c.concept}>` : c.name,
                    value: String(c.id),
                }));
        } catch {
            return [];
        }
    }
};
