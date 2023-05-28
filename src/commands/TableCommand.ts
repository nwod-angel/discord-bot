import { Interaction, Client, ApplicationCommandType, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { Command } from "../Command.js"
import DiscordChannelLogger from "../DiscordChannelLogger.js"
import TableProvider from "../data/TableProvider.js"
import { NwodSymbols } from "@nwod-angel/nwod-core"
import AsciiTable from 'ascii-table'
import FeedbackController from "./FeedbackController.js"
import { TableViewController as TableViewController } from "src/ViewControllers/TableViewController.js"

export const TableCommand: Command = {
    name: "table",
    description: "Lookup a table",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "name",
            "description": "The name of the table",
            "type": 3, // String
            "autocomplete": true
        },
        {
            "name": "description",
            "description": "Search in the description of the table",
            "type": 3, // String
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, options: interaction.options })

        let name: string | undefined = undefined
        if (interaction.options.get('name')) {
            name = interaction.options.get('name')!.value?.toString()
        }

        let tables = TableProvider.getTables(name)
        if (tables.filter(table => table.name.toLowerCase() === name!.toLowerCase()).length === 1) {
            tables = tables.filter(table => table.name.toLowerCase() === name!.toLowerCase())
        }

        let message = ""

        if (tables.length === 0) {
            await interaction.followUp({
                ephemeral: true,
                content: `No tables found.`
            })
            new FeedbackController(client, interaction).getFeedback()
        } else if (tables.length === 1) {
            let table = tables[0]
            TableViewController.displayTable(table, client, interaction)
            // message += `**${table.name}**\n`

            // let tableOutput = new AsciiTable()
            // tableOutput.removeBorder()
            // tableOutput.setHeading(table.table.headers)
            // table.table.rows.forEach(row => {
            //     tableOutput.addRow(row);
            // })

            // message += `\`\`\`\n${tableOutput.toString()}\n\`\`\`\n`

            // message += `**Sources:** ${table.sourcesString()}\n`

        } else {
            let tablesToDisplay = tables.slice(0, 25)
            let tableTitles = tablesToDisplay.map(s => s.name).join('\n')
            let parameters = ''

            message += `Multiple tables found`
            await interaction.followUp(message)
            new FeedbackController(client, interaction).getFeedback()

            // embed
            //     .setTitle(`Showing ${tablesToDisplay.length} of ${tables.length}`)
            //     .addFields(
            //         { name: `Showing ${tablesToDisplay.length} of ${tables.length}`, value: tableTitles, inline: false },
            //     )

        }

        // message += `${interaction.id}`

        // await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, embed: embed })
        // await interaction.followUp(message)
        // new FeedbackController(client, interaction).getFeedback()

    }
};
