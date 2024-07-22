import { Client } from "discord.js";

export default (client: Client): void => {
    client.on("unhandledException", error => {
        console.error('Unhandled exception:', error);
    });
};