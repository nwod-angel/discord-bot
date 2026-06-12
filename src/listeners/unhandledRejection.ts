import { Client } from "discord.js";
import { logger } from "../logger.js";

export default (client: Client): void => {
    client.on("unhandledRejection", error => {
        logger.error({ err: error }, 'Unhandled promise rejection');
    });
};