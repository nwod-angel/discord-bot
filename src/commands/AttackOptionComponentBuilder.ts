import { EmbedBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Attack from "./Attack.js";
import { AttackOption } from "./AttackOption.js";

export class AttackOptionComponentBuilder {

    attackOptions: {
        option: string;
        actionComponent: ButtonBuilder;
        action: (embed: EmbedBuilder, attack: Attack) => void;
    }[];

    constructor() {
        this.attackOptions = new Array<{
            option: string;
            actionComponent: ButtonBuilder;
            action: (embed: EmbedBuilder, attack: Attack) => void;
        }>();
    }

    addAttackOptions(AttackOptions: AttackOption[]) {

        AttackOptions.forEach((ao) => {
            this.attackOptions.push({
                option: ao.id,
                actionComponent: new ButtonBuilder()
                    .setCustomId(ao.id)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(ao.name)
                    .setEmoji(ao.symbol),
                action: (embed: EmbedBuilder, attack: Attack) => {
                    ao.apply(attack);
                    embed.addFields({
                        name: ao.fancyName(),
                        value: ao.summary,
                        inline: true
                    });
                }
            })
        })
        return this
    }

}
