import { AutocompleteInteraction, Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../Commands.js";
import { AutoCompleteCommands } from '../AutoCompleteCommands.js';
import { UpdateStatus } from "./UpdateStatus";
import { logger } from "../logger.js";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        try{
            UpdateStatus.startThinking(client)
            if (interaction.isCommand() || interaction.isContextMenuCommand()) {
                await handleSlashCommand(client, interaction);
            } else if (interaction.isAutocomplete()) {
                await handleAutoCompleteCommand(client, interaction as AutocompleteInteraction);
            }
            UpdateStatus.doSomethingRandom(client)
        } catch (ex) {
            logger.error({ err: ex }, 'Errored during interaction handler.')
        }
    });
};

const handleAutoCompleteCommand = async (client: Client, interaction: AutocompleteInteraction): Promise<void> => {
    const command = AutoCompleteCommands.find(c => c.name === interaction.commandName);
    if (!command) {
        logger.debug({ commandName: interaction.commandName }, 'No registered Autocomplete Command')
        return;
    }
    await interaction.respond(await command.autocomplete(client, interaction))
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
        logger.error({ err: ex }, 'Errored handling slash command.')
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
};
