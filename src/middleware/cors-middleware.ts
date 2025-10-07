import { cors } from "hono/cors";

export const authCorsMiddleware = (allowedOrigin: string) => {
    return cors({
        origin: allowedOrigin,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    });
};