import * as dotenv from "dotenv";

export function loadEnv() {
   // Select which .env file to load
   const envFile = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.local";

   // ✅ Load only missing variables, don't overwrite Render's PORT or others
   dotenv.config({
      path: envFile,
      override: false,
   });

   console.log(`✅ Loaded env file: ${envFile}`);
}
