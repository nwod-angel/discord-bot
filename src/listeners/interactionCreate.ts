import { Client, CommandInteraction, Interaction } from "discord.js";
import { Commands } from "../Commands.js";
import { AutoCompleteCommands } from '../AutoCompleteCommands.js';
import { UpdateStatus } from "./UpdateStatus";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        UpdateStatus.startThinking(client)
        if (interaction.isCommand() || interaction.isContextMenuCommand()) {
            await handleSlashCommand(client, interaction);
        }
        UpdateStatus.doSomethingRandom(client)
    });
};

const handleSlashCommand = async (client: Client, interaction: CommandInteraction): Promise<void> => {
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: "An error has occurred" });
        return;
    }

    await interaction.deferReply();

    slashCommand.run(client, interaction);
};