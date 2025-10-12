import { db } from "../database/client.js";
import { betterAuth } from "better-auth";
import * as authSchema from "../database/auth-schema.js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
   username as usernamePlugin,
   admin as adminPlugin,
   bearer as bearerPlugin,
} from "better-auth/plugins";
import { ac, roles as rolesObj } from "./access-control.js";

export const auth = betterAuth({
   appName: "E-commerce",
   baseURL: process.env.BETTER_AUTH_URL,
   database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: authSchema,
   }),
   socialProviders: {
      facebook: {
         clientId: process.env.FACEBOOK_CLIENT_ID as string,
         clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
         scope: ["email", "public_profile"],
      },
      google: {
         clientId: process.env.GOOGLE_CLIENT_ID as string,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
   },
   emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 50,
      autoSignIn: true,
   },
   session: {},
   plugins: [
      usernamePlugin(),
      adminPlugin({
         ac,
         roles: rolesObj,
      }),
      bearerPlugin(),
   ],
});
