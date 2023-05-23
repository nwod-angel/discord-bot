import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { TableCommand } from "../commands/TableCommand.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import tables from "../data/tables.js";

export const TableAutocomplete: AutoCompleteCommand = {
    name: TableCommand.name,
    maxResponses: 25,
    autocomplete: function (client: Client<boolean>, interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData<string | string>[] {
        let option = interaction.options.data.filter(d => d.focused)[0]
        if(!option) return []
        let value = interaction.options.get(option.name)!.value?.toString() || ''

        return tables
            .filter(r => r.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, this.maxResponses)
            .map(r => 
                ({
                    name: `${r.name}`,
                    value: r.name
                })) as unknown as ApplicationCommandOptionChoiceData<string | string>[];
    }
}