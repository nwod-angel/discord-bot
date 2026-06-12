import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, Client, CommandInteraction } from "discord.js";
import { logger } from "../logger.js";

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

        const responseInteraction = await this.interaction.followUp({
            components: [actionRow]
        })

        try {
            const response = await responseInteraction.awaitMessageComponent({ filter: i => i.user.id === this.interaction.user.id, time: 30000 })
            switch (response.customId) {
                case 'unhappy':
                    logger.info({
                        user_id: this.interaction.user.id,
                        interaction_id: this.interaction.id,
                        feedback: 'unhappy',
                    }, 'User feedback: unhappy');
                    break
                case 'happy':
                    logger.info({
                        user_id: this.interaction.user.id,
                        interaction_id: this.interaction.id,
                        feedback: 'happy',
                    }, 'User feedback: happy');
                    break
            }
            await response.editReply({ components: [] })
        } catch (e) {
            // No response
            await this.interaction.editReply({ components: [] })
        }


    }



}