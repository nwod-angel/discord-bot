import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, VirtualColumn } from "typeorm"

@Entity()
export class SavedRoll extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number
    
    @Column()
    userId: string

    @VirtualColumn({ query: (alias) => `SELECT COUNT("name") FROM "employees" WHERE "companyName" = ${alias}.name` })
    totalEmployeesCount: number;
    
    @Column("text")
    interaction: string

    @Column("text")
    result: string
}