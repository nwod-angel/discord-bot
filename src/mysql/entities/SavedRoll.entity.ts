import { CommandInteraction } from "discord.js";
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, VirtualColumn } from "typeorm"

@Entity()
export class SavedRoll extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column({ default: Date.now() })
    timestamp: Date;

    @Column("text")
    userId: string

    @Column("text")
    interaction: string

    @Column("number")
    result: number

    @Column("text")
    interactionId: string

    @Column("text")
    channelId: string
    
    @Column("text")
    applicationId: string

    @Column("text")
    guildId: string | null

    @Column("text")
    commandName: string

    @Column("text")
    commandId: string

    @Column("text")
    options: string
    
    @Column("number")
    interactionTimestamp: number;

    @Column("string")
    embed: string;

    @Column("string")
    rollDescription: string;

    @Column("number")
    successes: Number;

    parseInteraction(interaction: CommandInteraction) {
        this.interaction = JSON.stringify(interaction)
        this.interactionId = interaction.id
        this.channelId = interaction.channelId
        this.applicationId = interaction.applicationId
        this.guildId = interaction.guildId
        this.commandName = interaction.commandName
        this.commandId = interaction.commandId
        this.options = JSON.stringify(interaction.options)
        this.interactionTimestamp = interaction.createdTimestamp
    }

}