import { Client } from "discord.js";
import { logger } from "../logger.js";

export default (client: Client): void => {
    client.on("unhandledException", error => {
        logger.error({ err: error }, 'Unhandled exception');
    });
};