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
   secret: process.env.BETTER_AUTH_SECRET,
   database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: authSchema,
   }),
   emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 50,
      autoSignIn: true,
   },
   advanced: {
      crossSubDomainCookies: {
         enabled: true,
      },
      useSecureCookies: true,
   },
   plugins: [
      usernamePlugin(),
      adminPlugin({
         ac,
         roles: rolesObj,
      }),
      bearerPlugin(),
   ],
});
