import { CacheType, Client, CommandInteraction } from "discord.js";
import { TextChannel } from 'discord.js';
import * as dotenv from 'dotenv'
dotenv.config(); //initialize dotenv

interface Logger {
     log(message: string) : void
     logBaggage(object: any): void
}

function stringify (content: any): string {
	
	if (!content) return ""

	if(content && content.stack && content.message && typeof content.stack === 'string' && typeof content.message === 'string') return JSON.stringify(content, ["message", "arguments", "type", "name", "stack"])

	if (typeof(content) === 'string') return content

	if (typeof(content) === 'object') {
		return JSON.stringify(content, (key, value) =>
			typeof value === 'bigint'
					? value.toString()
					: value // return everything else unchanged
		)
	}
    return ''
}

export default class DiscordChannelLogger implements Logger {
        
    static client: Client<boolean>;
    static loggingChannelId = process.env['DISCORD_LOGGING_CHANNEL_ID']!
    static feedbackChannelId = process.env['DISCORD_FEEDBACK_CHANNEL_ID']!

    static setClient(client: Client) {
        this.client = client
        return this
    }
    
    static chunkString(str: string, length: number): Array<string> {
        return str.match(new RegExp('(.|[\r\n]){1,' + length + '}', 'g')) || new Array<string>()
    }
    
    static log(message: string, channelId: string): void {
        this.client.channels.fetch(channelId)
            .then(channel => {
                let chunks = this.chunkString(message, 1500)
                chunks.forEach((messageChunk, index) => {
                    (channel as TextChannel).send(`${index+1}/${chunks.length}\n${messageChunk}`)  
                })
            })
    }

    static logBaggage(object: any) {
        DiscordChannelLogger.log(`\`\`\`\n${stringify(object)}\n\`\`\``, this.loggingChannelId)
    }

    static logFeedback(feedback: string) {
        DiscordChannelLogger.log(feedback, this.loggingChannelId)
    }
    
    log(message: string): void {
        if (DiscordChannelLogger.client == undefined) {
            throw Error("Must define a client on the static instance before logging to this logger.")
        }
        DiscordChannelLogger.log(message, DiscordChannelLogger.loggingChannelId)
    }
    
    logBaggage(object: any): void {
        DiscordChannelLogger.log(`\`\`\`\n${stringify(object)}\n\`\`\``, DiscordChannelLogger.loggingChannelId)
    }

}
