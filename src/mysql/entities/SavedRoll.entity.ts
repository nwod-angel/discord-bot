import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from "typeorm"

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
}