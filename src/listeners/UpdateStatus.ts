import { ActivityType, Client } from "discord.js";

export class UpdateStatus {

    // Playing ...
    static statuses = [
        'with dice',
        'with a new character idea',
        'nWoD',
        'a new story',
        'an Arcanthus',
        'a werewolf',
        'a mage',
        'a hunter',
        'a promethean',
        'a giest',
        'a mummy',
        'all the NPCs'
    ]

    static doSomethingRandom(client: Client) {
        this.setStatus(client, this.getRandomStatus())
    }

    static startThinking(client: Client) {
        this.setStatus(client, 'thinking...')
    }

    static setStatus(client: Client, status: string) {
        if(client.user) {
            client.user.setPresence({ activities: [{ name: status, type: ActivityType.Playing }] })
        }
    }

    static getRandomStatus(): string {
        return this.statuses[Math.floor(Math.random() * this.statuses.length)]
    }
}
