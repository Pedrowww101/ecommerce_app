import { defineConfig } from "drizzle-kit";

import * as dotenv from "dotenv";
const envFile = process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.local';
dotenv.config({ path: envFile });

if (!process.env.DATABASE_URL) throw Error("Database connection env not set up")

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/database/app-schema.ts", "./src/database/auth-schema.ts"],
  out: "./src/database/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
