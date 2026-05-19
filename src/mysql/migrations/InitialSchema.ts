import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Captures the SavedRoll entity schema into a one-time migration.
 *
 * Safe to run even if synchronize:true created the table already:
 * hasTable() + ifNotExist guard prevents duplicate table errors.
 *
 * Once applied, set synchronize:false on all DataSources so schema
 * changes only happen through migrations.
 */
export class InitialSchema1746817800000 implements MigrationInterface {
  name = "InitialSchema1746817800000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("saved_roll");

    if (!exists) {
      await queryRunner.createTable(
        new Table({
          name: "saved_roll",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            {
              name: "timestamp",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
            { name: "userId", type: "text" },
            { name: "interaction", type: "text" },
            { name: "result", type: "int" },
            { name: "interactionId", type: "text" },
            { name: "channelId", type: "text" },
            { name: "applicationId", type: "text" },
            { name: "guildId", type: "text", isNullable: true },
            { name: "commandName", type: "text" },
            { name: "commandId", type: "text" },
            { name: "options", type: "text" },
            { name: "embed", type: "text" },
            { name: "rollDescription", type: "text" },
            { name: "successes", type: "int" },
          ],
        }),
        true, // ifNotExist — additional safety
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("saved_roll");
  }
}
