
import { Client, ButtonInteraction } from "discord.js";

export interface CustomButtonInteraction {
    run: (client: Client, interaction: ButtonInteraction) => void;
}