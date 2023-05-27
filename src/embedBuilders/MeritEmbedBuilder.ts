import { MeritDefinition, NwodSymbols } from "@nwod-angel/nwod-core";
import { EmbedBuilder } from "discord.js";

const symbols = new NwodSymbols()

export const MeritEmbedBuilder = {

    buildMeritEmbed(merit: MeritDefinition, embed: EmbedBuilder) {

        embed.setTitle(merit.titleString())

        if (merit.hasRequirements()) {
            embed.addFields({ name: 'Requirements', value: merit.requirementsString(), inline: false })
        }

        let descriptionChunks = merit.description.match(/.{1,1000}/g) || []
        descriptionChunks.forEach((chunk: string, index: number) => {
            embed.addFields({ name: `Effect ${index > 0 ? ' (continued)' : ''}`, value: chunk, inline: false })
        })
        try {
            merit.levels.forEach(level => {
                let levelDescriptionChunks = level.description.match(/.{1,1000}/g) || []
                levelDescriptionChunks.forEach((descriptionChunk: string, index: number) => {
                    embed.addFields({ name: `${level.name || merit.name} ${symbols.MeritDot.repeat(level.level)} ${index > 0 ? ' (continued)' : ''}`, value: descriptionChunk, inline: false })
                })
            })
        } catch (error) {
            console.error('An error occurred while adding fields to the embed:', error)
            console.log("Merit:")
            console.log(merit)
        }

        embed.addFields({ name: 'Sources', value: merit.sourcesString(), inline: false })

    }
}
