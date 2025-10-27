import { cors } from "hono/cors";

export const authCorsMiddleware = () => {
   return cors({
      origin: (origin) => origin || "*",
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
   });
};
