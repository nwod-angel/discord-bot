import { Client } from "discord.js";
import { loadCommands } from "../Commands.js";
import { loadAutoCompleteCommands } from "../AutoCompleteCommands.js";
import { UpdateStatus } from "./UpdateStatus.js";
import { logger } from "../logger.js";

export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        const [commands] = await Promise.all([
            loadCommands(),
            loadAutoCompleteCommands(),
        ]);
        await client.application.commands.set(commands);

        logger.info({ username: client.user.username }, 'Bot is online');
        UpdateStatus.doSomethingRandom(client)
    });
};
