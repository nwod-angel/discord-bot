import { Client } from "discord.js";

export default (client: Client): void => {
    client.on("unhandledException", error => {
        console.log(Date.now())
        console.error('Unhandled exception:', error);
    });
};