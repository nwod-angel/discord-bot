import { Client } from "discord.js";

export default (client: Client): void => {
    client.on("unhandledRejection", error => {
        console.log(Date.now())
        console.error('Unhandled promise rejection:', error);
    });
};