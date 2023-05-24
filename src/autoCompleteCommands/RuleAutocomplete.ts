import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { RuleCommand } from "../commands/RuleCommand.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import rules from "../data/rules.js";

export const RuleAutocomplete: AutoCompleteCommand = {
    name: RuleCommand.name,
    maxResponses: 25,
    autocomplete: function (client: Client<boolean>, interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData<string | string>[] {
        let option = interaction.options.data.filter(d => d.focused)[0]
        if(!option) return []
        let value = interaction.options.get(option.name)!.value?.toString() || ''

        return rules
            .filter(r => r.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, this.maxResponses)
            .map(r => 
                ({
                    name: `[${r.prefix}] ${r.name}`,
                    value: r.name
                })) as unknown as ApplicationCommandOptionChoiceData<string | string>[];
    }
}