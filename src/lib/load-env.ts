import * as dotenv from "dotenv";

export function loadEnv() {
   const envFile = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.local";
   dotenv.config({ path: envFile });
   console.log(`✅ Loaded env file: ${envFile}`);
}
