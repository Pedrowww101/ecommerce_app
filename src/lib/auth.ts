import {  db } from "../database/client.js";
import { betterAuth } from "better-auth";
import * as authSchema from "../database/auth-schema.js"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins"

export const auth = betterAuth({
    appName: "E-commerce",
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural:true,
        schema: authSchema
      }), 
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 50,
        autoSignIn: false,
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
        }
    },
    session: {
        
    },
    plugins: [username()]
})
