import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, VirtualColumn } from "typeorm"

@Entity()
export class SavedRoll extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column()
    userId: string

    @Column("text")
    interaction: string

    @Column("text")
    result: string

    get interactionId(): string {
        return JSON.parse(this.interaction).id
    }
    get channelId(): string {
        return JSON.parse(this.interaction).channelId
    }
    get applicationId(): string {
        return JSON.parse(this.interaction).applicationId
    }
    get guildId(): string {
        return JSON.parse(this.interaction).guildId
    }
    get commandId(): string {
        return JSON.parse(this.interaction).commandId
    }
    get commandName(): string {
        return JSON.parse(this.interaction).commandName
    }
    get options(): string {
        return JSON.parse(this.interaction).options
    }
}