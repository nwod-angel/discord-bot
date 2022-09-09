import { Client } from "discord.js";

export default (client: Client): void => {
    client.on("unhandledRejection", error => {
        console.error('Unhandled promise rejection:', error);
    });
};