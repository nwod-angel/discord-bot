import { ActivityType, Client } from "discord.js";
import { logger } from "../logger.js";
import statuses from "../data/statuses.json" with { type: "json" };

export class UpdateStatus {

    static doSomethingRandom(client: Client) {
        this.setStatus(client, this.getRandomStatus())
    }

    static startThinking(client: Client) {
        this.setStatus(client, 'thinking...')
    }

    static setStatus(client: Client, status: string) {
        if(client.user) {
            try{
                client.user.setPresence({ activities: [{ name: status, type: ActivityType.Custom }] })
            } catch (ex) {
                logger.error({ err: ex }, "Error calling 'client.user.setPresence'.")
            }

        }
    }

    static getRandomStatus(): string {
        return statuses[Math.floor(Math.random() * statuses.length)]
    }
}
