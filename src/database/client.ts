import * as dotenv from "dotenv";
const envFile = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.local";
dotenv.config({ path: envFile });

console.log("Loaded env file:", envFile);

import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as appSchema from "../database/app-schema.js";

console.log("DB URL CHECK:", process.env.DATABASE_URL ? "SET" : "NOT SET"); // <-- ADD THIS

if (!process.env.DATABASE_URL)
   throw Error("Database connection env not set up");

function createDbClient() {
   const client = postgres(process.env.DATABASE_URL!, {
      max: 2,
   });
   return drizzle(client, {
      schema: { ...appSchema },
   });
}

declare global {
   var __db__: PostgresJsDatabase<typeof appSchema> | undefined;
}

if (!global.__db__) {
   console.log("Initializing NEW Drizzle Client for Development...");
   global.__db__ = createDbClient();
}

export const db = global.__db__;

export type DrizzleClient = typeof db;
