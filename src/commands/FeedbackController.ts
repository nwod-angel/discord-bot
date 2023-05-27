import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, Client, CommandInteraction } from "discord.js";
import DiscordChannelLogger from "../DiscordChannelLogger";

export default class FeedbackController {

    interaction: CommandInteraction<CacheType>
    client: Client<boolean>

    constructor(client: Client<boolean>, interaction: CommandInteraction<CacheType>) {
        this.client = client
        this.interaction = interaction
        return this
    }

    async getFeedback() {

        // Get feedback
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('happy')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("🙂")
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('unhappy')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("😦")
            )

        const responseInteraction = await this.interaction.editReply({
            components: [actionRow]
        })

        try {
            const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === this.interaction.user.id, time: 30000 })
            switch (response.customId) {
                case 'unhappy':
                    let unhappy = `${this.interaction.user.username} is unhappy with interaction ${this.interaction.id}.`
                    DiscordChannelLogger.setClient(this.client).logFeedback(unhappy)
                    break
                case 'happy':
                    let happy = `${this.interaction.user.username} is happy with interaction ${this.interaction.id}.`
                    console.log(happy)
                    DiscordChannelLogger.setClient(this.client).logFeedback(happy)
                    break
            }
            await response.editReply({ components: [] })
        } catch (e) {
            // No response
            await this.interaction.editReply({ components: [] })
        }


    }



}