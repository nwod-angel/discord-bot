import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../Command.js";
import DiscordChannelLogger from "../DiscordChannelLogger.js";
import SpellProvider from "../data/SpellProvider.js";
import arcanum from "../data/arcanum.js";
import { Arcana, ArcanaType, Practice, PracticeType } from "@nwod-angel/nwod-core";
import FeedbackController from "./FeedbackController.js";
import { Console } from "console";

export const SpellCommand: Command = {
    name: "spell",
    description: "Lookup a spell",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the spell",
            "type": 3, // String
            "autocomplete" : true
        },
        {
            "name": "description",
            "description": "Search in the description of the spell",
            "type": 3, // String
        },
        {
            "name": "arcana",
            "description": "The arcana of the spell",
            "type": 3, // String,
            "choices": Object.keys(Arcana).filter((item) => { return isNaN(Number(item)) }).map(a => ({ name: a, value: a}))
        },
        {
            "name": "dots",
            "description": "The number of dots of the spell's primary arcana",
            "type": 4, // Integer
            "minValue": 1,
            "maxValue": 5
        },
        {
            "name": "practice",
            "description": "The practice of the spell",
            "type": 3, // String,
            "choices": Object.keys(Practice).filter((item) => { return isNaN(Number(item)) }).map(a => ({ name: a, value: a}))
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, options: interaction.options})

        let name: string | undefined = undefined
        if(interaction.options.get('name')){
            name = interaction.options.get('name')!.value?.toString()
        }

        let description: string | undefined = undefined
        if(interaction.options.get('description')){
            description = interaction.options.get('description')!.value?.toString()
        }

        let arcana: Arcana | undefined = undefined
        if(interaction.options.get('arcana')){
            arcana = Arcana[interaction.options.get('arcana')!.value?.toString() as ArcanaType]
        }

        let practice: Practice | undefined = undefined
        if(interaction.options.get('practice')){
            practice = Practice[interaction.options.get('practice')!.value?.toString() as PracticeType]
        }

        let dots: number | undefined = undefined
        if(interaction.options.get('dots')){
            dots = Number(interaction.options.get('dots')?.value)
        }

        let spells = SpellProvider.getSpells(name, description, arcana, practice, dots)
        if(name && spells.filter(spell => spell.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            spells = spells.filter(spell => spell.name.toLowerCase() === name!.toLowerCase())
        }

        let embeds = []
        let embed = new EmbedBuilder()
            .setFooter({ 
                text: interaction.id, 
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if(spells.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No spells found.`
            })
        } else if(spells.length === 1){
            let spell = spells[0]
            embed
            .setTitle(spell.titleString())
            .addFields(
                { name: 'Requirements', value: spell.requirementsString(), inline: false },
                { name: 'Practice', value: spell.practiceString(), inline: true },
                { name: 'Action', value: spell.action, inline: true },
                { name: 'Duration', value: spell.duration, inline: true },
                { name: 'Aspect', value: spell.aspect, inline: true },
                { name: 'Cost', value: spell.cost, inline: true },
                // { name: 'Effect', value: spell.description, inline: false },
            )
            let descriptionChunks = spell.description.match(/.{1,1000}/g) || []
            descriptionChunks.forEach((chunk: string, index: number) => {
                embed.addFields({ name: `Effect (${index + 1}/${descriptionChunks.length})`, value: chunk, inline: false })
            })
            embed.addFields({ name: 'Sources', value: spell.sourcesString(), inline: false })
            embeds.push(embed)
        } else {
            let spellsToDisplay = spells.slice(0, 25)
            // let spellTitles = spellsToDisplay.map(s => s.titleString()).join('\n')
            let parameters = []
            if(name) { parameters.push(`Name contains: ${name}`) }
            if(description) { parameters.push(`Description contains: ${description}`) }
            if(arcana) { parameters.push(`Arcana: ${arcana}`) }
            if(dots) { parameters.push(`Dots: ${dots}`) }
            if(practice) { parameters.push(`Practice: ${practice}`) }

            // .setTitle(`Showing ${spellsToDisplay.length} of ${spells.length} spells`)
            // if(parameters.length > 0) {
            //     embed.setDescription(parameters.join('\n'))
            // }
            // spells = spellsToDisplay
            
            let uniqArcana = [...new Set(spells.map(s => s.primaryArcana.toString()))]
            for(let listedArcana in uniqArcana){
                let icon = arcanum.filter(a => a.name.toLowerCase() === Arcana[listedArcana].toLowerCase())[0].icon
                let name = `${icon} ${Arcana[listedArcana]}`
                let spellEmbed = new EmbedBuilder()
                    .setTitle(name)
                let arcanaSpellList = spells.filter(s => s.primaryArcana.toString() === listedArcana)
                if(arcanaSpellList.length <= 25) {
                    let value = arcanaSpellList.map(s => s.titleString()).join('\n')
                    if (name && value) {
                        spellEmbed.setDescription(value)
                    }
                } else {
                    let uniqDots = [...new Set(arcanaSpellList.map(s => s.dots))]
                    for(let listedDots in uniqDots) {
                        console.debug(listedDots)
                        let dotSpellList = spells.filter(s => s.dots.toString() === listedDots)
                        let name = `${Arcana[listedArcana]} ${listedDots}`
                        let value = dotSpellList.map(s => s.name).join('\n')
                        if (name && value) {
                            spellEmbed.addFields( { name: name, value: value, inline: false } )   
                        } 
                    }
                }
                embeds.push(spellEmbed)
            }
        }

        // Check embed limits
        // Embed title is limited to 256 characters
        // if(embed.data.title){
        //     console.debug(`Debug: embed.data.title length: ${embed.data.title.length}.`);
        // }
        // // Embed description is limited to 4096 characters
        // if(embed.data.description){
        //     console.debug(`Debug: embed.data.description length: ${embed.data.description.length}.`);
        // }
        // // An embed can contain a maximum of 25 fields
        // if(embed.data.fields){
        //     console.debug(`Debug: embed.data.fields length: ${embed.data.fields.length}.`);
        // }
        // // A field name/title is limited to 256 character and the value of the field is limited to 1024 characters
        // if(embed.data.fields){
        //     embed.data.fields.forEach(field => {
        //         if(field.name){
        //             console.debug(`Debug: field.name: ${field.name}.`);
        //             console.debug(`Debug: field.name length: ${field.name.length}.`);
        //         }
        //         if(field.value){
        //             console.debug(`Debug: field.name length: ${field.value.length}.`);
        //         }
        //     });
        // }
        // // Embed footer is limited to 2048 characters
        // if(embed.data.footer){
        //     console.debug(`Debug: embed.data.footer.text length: ${embed.data.footer.text}.`);
        // }
        // // Embed author name is limited to 256 characters
        // if(embed.data.author){
        //     console.debug(`Debug: embed.data.author.name length: ${embed.data.author.name}.`);
        // }
        // // The total of characters allowed in an embed is 6000

        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})
        await interaction.followUp({
            ephemeral: true,
            embeds: embeds
        });
        // new FeedbackController(client, interaction).getFeedback()

    }
};
