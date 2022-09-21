import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "../Command.js";
import DiscordChannelLogger from "../DiscordChannelLogger.js";
import MeritProvider from "../data/MeritProvider.js";

export const MeritCommand: Command = {
    name: "merit",
    description: "Lookup a merit",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the merit",
            "type": 3, // String
            "autocomplete" : true
        },
        {
            "name": "description",
            "description": "Search in the description of the merit",
            "type": 3, // String
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

        let merits = MeritProvider.getMerits(name, description)
        if(merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            merits = merits.filter(merit => merit.name.toLowerCase() === name!.toLowerCase())
        }

        let embed = new EmbedBuilder()
            .setFooter({ 
                text: interaction.id, 
                // iconURL: 'https://i.imgur.com/AfFp7pu.png'
            })

        if(merits.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No merits found.`
            })
        } else if(merits.length === 1){
            let merit = merits[0]
            embed.setTitle(merit.titleString())

            if(merit.hasRequirements()) {
                embed.addFields( { name: 'Requirements', value: merit.requirementsString(), inline: false } )
            }

            let descriptionChunks = merit.description.match(/.{1,1000}/g) || []
            descriptionChunks.forEach((chunk: string, index: number) => {
                embed.addFields({ name: `Effect (${index + 1}/${descriptionChunks.length})`, value: chunk, inline: false })
            })

            merit.levels.forEach(level => {
                embed.addFields({ name: `${level.name || merit.name} ${'•'.repeat(level.level)}`, value: level.description, inline: false })
            })

            embed.addFields({ name: 'Sources', value: merit.sourcesString(), inline: false })
        } else {
            let meritsToDisplay = merits.slice(0,25)
            let meritTitles = meritsToDisplay.map(s => s.titleString()).join('\n')
            let parameters = ''

            embed
            .setTitle(`Showing ${meritsToDisplay.length} of ${merits.length}`)
            .addFields(
                { name: `Showing ${meritsToDisplay.length} of ${merits.length}`, value: meritTitles, inline: false },
            )

        }
        
        // Get feedback
		const feedbackRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('helpful')
                .setLabel('Helpful')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('unhelpful')
                .setLabel('Unhelpful')
                .setStyle(ButtonStyle.Primary),
        );

        await interaction.followUp({
            ephemeral: true,
            embeds: [embed],
            // components: [feedbackRow]
        });
        DiscordChannelLogger.setClient(client).logBaggage({interaction: interaction, embed: embed})

    }
};
