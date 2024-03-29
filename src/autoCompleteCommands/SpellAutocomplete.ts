import { Client, AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { SpellCommand } from "../commands/SpellCommand.js";
import { AutoCompleteCommand } from "../AutoCompleteCommand.js";
import spells from "../data/spells.js";
import { NwodSymbols } from "@nwod-angel/nwod-core";
// import { SymbolLibrary } from "../SymbolLibrary.js"
// const DOT = SymbolLibrary.DotLargeWhite

export const SpellAutocomplete: AutoCompleteCommand = {
    name: SpellCommand.name,
    maxResponses: 25,
    autocomplete: function (client: Client<boolean>, interaction: AutocompleteInteraction): ApplicationCommandOptionChoiceData<string | string>[] {
        let option = interaction.options.data.filter(d => d.focused)[0]
        if(!option) return []
        let value = interaction.options.get(option.name)!.value?.toString() || ''
        const symbols = new NwodSymbols()

        return spells
            .filter(s => s.name.toLowerCase().includes(value.toLowerCase()))
            .slice(0, this.maxResponses)
            .map(s => 
                ({
                    name: `${s.name} (${s.primaryArcana} ${symbols.SpellArcanaDots.repeat(parseInt(s.requirements.filter(r => r.name.toLowerCase() === s.primaryArcana.toLowerCase())[0].dots!))})`,
                    value: s.name
                })) as unknown as ApplicationCommandOptionChoiceData<string | string>[];
    }
}