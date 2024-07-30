import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, VirtualColumn } from "typeorm"

@Entity()
export class SavedRoll extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column()
    userId: string

    @VirtualColumn({ query: (alias) => `SELECT JSON_EXTRACT(interaction, "$.channelId") as channelId FROM "saved_roll" WHERE "id" = ${alias}.id` })
    channelId: number;
    
    @Column("text")
    interaction: string

    @Column("text")
    result: string
}