import { ButtonInteraction, Client } from "discord.js";
import { CustomButtonInteraction } from "./CustomButtonInteraction.js";

export const MeritCommandInteraction: CustomButtonInteraction = {
    run: async (client: Client, interaction: ButtonInteraction) => {
        const content = "Thanks for the feedback!";

        await interaction.followUp({
            ephemeral: true,
            content
        });
    },
};
