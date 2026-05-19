import { DataSource } from "typeorm";
import { SavedRoll } from "./entities/SavedRoll.entity";
import { InitialSchema1746817800000 } from "./migrations/InitialSchema.js";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT'] || "3306"),
    username: process.env['DB_USER'],
    password: process.env['DB_PSWD'],
    database: process.env['DB_NAME'],
    logging: JSON.parse(process.env['DB_LOGGING'] || "false"),
    synchronize: false,
    migrationsRun: true,
    entities: [SavedRoll],
    subscribers: [],
    migrations: [InitialSchema1746817800000],
})

AppDataSource.initialize()
  .then(async () => {
    console.log("Connection initialized with database...");
  })
  .catch((error) => console.log(error));

export const getDataSource = (delay = 3000): Promise<DataSource> => {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (AppDataSource.isInitialized) resolve(AppDataSource);
      else reject("Failed to create connection with database");
    }, delay);
  });
};