import { ActivityType, Client } from "discord.js";

export class UpdateStatus {

    // Playing ...
    static statuses = [
        'nWoD',
        'World of Darkness',

        'with dice',
        'with new dice',
        'with number rocks',
        'with a new character idea',
        'with a new character concept',
        'with a new story idea',
        'a new story',
        'a new story ideas',
        'all the NPCs',

        'Mage the Awakening',
        'MtAw',
        'a mage',
        'a willworker',
        'an Acanthus',
        'a Moros',
        'a Mastigos',
        'an Obrimos',
        'a Thyrsus',
        'a Silver Ladder',
        'an Adamantine Arrow',
        'a Gaurdian of the Veil',
        'a Free Councillor',
        'a Mystagog',
        'a Seer',
        'a Banisher',

        'Vampire the Requiem',
        'VtR',
        'a vampire',
        'a kindred',
        'a Daeva',
        'a Gangrel',
        'a Mekhet',
        'a Nosferatu',
        'a Ventrue',
        'a Carthian',
        'a Circle of the Crone',
        'an Invictus',
        'a Lancea Sanctum',
        'an Ordo Dracul',

        'Werewolf the Forsaken',
        'WtF',
        'a werewolf',
        'a Cahalith',
        'an Elodoth',
        'an Irraka',
        'an Ithaeur',
        'a Rahu',
        'a Pure',
        'a Blood Talon',
        'a Bone Shadow',
        'a Ghost Wolf',
        'a Hunter in Darkness',
        'an Iron Master',
        'a Storm Lord',

        'Hunter the Vigil',
        'HtV',
        'a hunter',
        
        'Promethean the Created',
        'PtC',
        'a promethean',

        'Geist the Sin-Eaters',
        'GtSE',
        'a giest',
        
        'Mummy the Cursed',
        'MtC',
        'a mummy'
    ]

    static doSomethingRandom(client: Client) {
        this.setStatus(client, this.getRandomStatus())
    }

    static startThinking(client: Client) {
        this.setStatus(client, 'thinking...')
    }

    static setStatus(client: Client, status: string) {
        if(client.user) {
            try{
                client.user.setPresence({ activities: [{ name: status, type: ActivityType.Playing }] })
            } catch (ex) {
                console.log("Error calling 'client.user.setPresence'.")
                console.log(ex)
            }

        }
    }

    static getRandomStatus(): string {
        return this.statuses[Math.floor(Math.random() * this.statuses.length)]
    }
}
