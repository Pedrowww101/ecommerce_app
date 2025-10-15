// drizzle.config.ts (Corrected)
import { defineConfig } from "drizzle-kit";

import { loadEnv } from "./src/lib/load-env.js";

loadEnv();

if (!process.env.DATABASE_URL)
   throw Error("Database connection env not set up");

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
