import { AutocompleteInteraction, Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../Commands.js";
import { AutoCompleteCommands } from '../AutoCompleteCommands.js';
import { UpdateStatus } from "./UpdateStatus";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        try{
            UpdateStatus.startThinking(client)
            if (interaction.isCommand() || interaction.isContextMenuCommand()) {
                await handleSlashCommand(client, interaction);
            } else if (interaction.isCommand() || interaction.isAutocomplete()) {
                await handleAutoCompleteCommand(client, interaction as AutocompleteInteraction);
            }
            UpdateStatus.doSomethingRandom(client)
        } catch (ex) {
            console.log('Errored during interaction handler.')
            console.log(ex)
        }
    });
};

const handleAutoCompleteCommand = async (client: Client, interaction: AutocompleteInteraction): Promise<void> => {
    const command = AutoCompleteCommands.find(c => c.name === interaction.commandName);
    if (!command) {
        console.log(`No registered Autocomplete Command for ${interaction.commandName}`)
        return;
    }
    interaction.respond(command.autocomplete(client, interaction))
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    try{
        const slashCommand = Commands.find(c => c.name === interaction.commandName);
        if (!slashCommand) {
            interaction.followUp({ content: "An error has occurred" });
            return;
        }

        await interaction.deferReply();

        slashCommand.run(client, interaction);
    } catch (ex) {
        console.log('Errored handling slash command.')
        console.log(ex)
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
};
