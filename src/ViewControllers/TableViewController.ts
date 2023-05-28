import { Client, CommandInteraction, Interaction } from "discord.js"
import AsciiTable from 'ascii-table'
import { TableDefinition } from "../data/TableDefinition"
import DiscordChannelLogger from "../DiscordChannelLogger"

export const TableViewController = {

    displayTable: async (table: TableDefinition, client: Client, interaction: CommandInteraction) => {

        let tableString = await TableViewController.buildTable(table, 1, 1)
        let tableChunks = tableString.match(/(?:(?:.){1,1000}(?:$|\n)|(?:.){1,1000}(?: |$|\n))/sgm) || []


        tableChunks.forEach((chunk: string, index: number) => {
            let message = ""
            message += `**${table.name}**\n`
            message += `\`\`\`\n${chunk}\n\`\`\`\n`
            message += `**Sources:** ${table.sourcesString()}\n`
            message += `${interaction.id}`
            interaction.followUp(message)
        })

        // await DiscordChannelLogger.setClient(client).logBaggage({ interaction: interaction, content: message })

    },

    buildTable: async (table: TableDefinition, parts: number, part: number) => {

        let tableOutput = new AsciiTable()
        tableOutput.removeBorder()
        tableOutput.setHeading(table.table.headers)
        table.table.rows.forEach(row => {
            tableOutput.addRow(row);
        })

        return tableOutput.toString()
    }
}