import { cors } from "hono/cors";

export const authCorsMiddleware = (allowedOrigins: string[]) => {
    return cors({
      origin: (requestOrigin) => {
        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
          return requestOrigin;
        }
        return "";
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    });
  };