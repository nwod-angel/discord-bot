import { Spell } from "@nwod-angel/nwod-core";
import { EmbedBuilder } from "discord.js";
import { chunkText } from "./chunkText.js";

export const SpellEmbedBuilder = {

    buildSpellEmbed(spell: Spell, embed: EmbedBuilder) {

        embed.setTitle(spell.titleString())

        if (spell.requirements && spell.requirements.length > 0) {
            embed.addFields({ name: 'Requirements', value: spell.requirementsString(), inline: false })
        }

        embed.addFields(
            { name: 'Practice', value: spell.practiceString(), inline: true },
            { name: 'Action', value: spell.action, inline: true },
            { name: 'Duration', value: spell.duration, inline: true },
            { name: 'Aspect', value: spell.aspect, inline: true },
            { name: 'Cost', value: spell.cost, inline: true },
        )

        const descriptionChunks = chunkText(spell.description)
        descriptionChunks.forEach((chunk: string, index: number) => {
            embed.addFields({ name: `Effect (${index + 1}/${descriptionChunks.length})`, value: chunk, inline: false })
        })

        embed.addFields({ name: 'Sources', value: spell.sourcesString(), inline: false })
    }
}
