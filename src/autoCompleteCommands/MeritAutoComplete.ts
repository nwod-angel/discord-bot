import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import MeritProvider from "../data/MeritProvider.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import { MeritCommand } from "../commands/MeritCommand.js";

export const MeritAutocomplete: AutoCompleteCommand = {
    name: MeritCommand.name,
    maxResponses: 25,
    autocomplete: function (client: Client<boolean>, interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData<string | string>[] {
        let option = interaction.options.data.filter(d => d.focused)[0]
        if(!option) return []
        let value = interaction.options.get(option.name)!.value?.toString() || ''

        
        return MeritProvider
            .getMerits(value)
            .slice(0, this.maxResponses)
            .map(merit => 
                ({
                    name: merit.titleString(),
                    value: merit.name
                })) as unknown as ApplicationCommandOptionChoiceData<string | string>[];
    }
}