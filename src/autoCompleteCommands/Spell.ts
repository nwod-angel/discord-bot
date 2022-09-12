import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import spells from "../data/spells";

export const Spell: AutoCompleteCommand = {
    name: "spell",
    maxResponses: 25,
    autocomplete: function (client: Client<boolean>, interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData<string | string>[] {
        let option = interaction.options.data.filter(d => d.focused)[0]
        if(!option) return []
        let value = interaction.options.get(option.name)!.value?.toString() || ''

        return spells
            .map(s => s.name)
            .filter(s => s.toLowerCase().includes(value.toLowerCase()))
            .slice(0, this.maxResponses)
            .map(s => ({ name: s, value: s })) as unknown as ApplicationCommandOptionChoiceData<string | string>[];
    }
}