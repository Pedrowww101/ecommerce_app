import { defineConfig } from "drizzle-kit";

import * as dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.local";
dotenv.config({ path: envFile });

console.log(">>> NODE_ENV:", process.env.NODE_ENV);
console.log(
   ">>> ENV from drizzle.config.ts:",
   process.env.DATABASE_URL ? "SET" : "NOT SET"
);

if (!process.env.DATABASE_URL)
   throw Error("Database connection env not set up");

export default defineConfig({
   dialect: "postgresql",
   // schema: ["./src/database/app-schema.ts", "./src/database/auth-schema.ts"],
   schema: "./dist/database/**/*.js",
   casing: "snake_case",
   out: "./src/database/drizzle",
   dbCredentials: {
      url: process.env.DATABASE_URL,
   },
   verbose: true,
   strict: true,
});
