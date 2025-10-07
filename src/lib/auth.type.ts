import { auth } from "../lib/auth.js"

export type AuthVariables = {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
}

export type Env = {
    Variables: AuthVariables;
    Bindings: {
        BETTER_AUTH_URL: string
    }
}