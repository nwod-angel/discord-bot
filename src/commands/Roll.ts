import { Interaction, Client, ApplicationCommandType, ApplicationCommandOptionType, CommandInteraction, ApplicationCommand, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../Command";
import { InstantRoll } from "@nwod-angel/nwod-roller";
// import roller from "@nwod-angel/nwod-roller";

export const Roll: Command = {
    name: "roll",
    description: "Rolls dice",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            "name": "dice-pool",
            "description": "dice pool",
            "type": 4,
            "required": true
        }
    ],
    run: async (client: Client, interaction: CommandInteraction) => {
        let dicePool = Number(interaction.options.get('dice-pool')!.value)

        var roll = new InstantRoll({dicePool: dicePool})
        const content = roll.toString()
		
        // 2000 character limit
        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};
