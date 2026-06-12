import { Client } from "discord.js";
import { Commands } from "../Commands.js";
import { UpdateStatus } from "./UpdateStatus.js";
import { logger } from "../logger.js";

export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        await client.application.commands.set(Commands);

        logger.info({ username: client.user.username }, 'Bot is online');
        UpdateStatus.doSomethingRandom(client)
    });
};