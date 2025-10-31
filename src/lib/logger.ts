import pino from "pino";

const nodeEnv = process.env.NODE_ENV;
const isProd = nodeEnv === "production";
const isDev = nodeEnv === "development" || nodeEnv === "local";

export const logger = pino({
   level: isProd ? "info" : "debug", // less noise in production
   transport: isDev
      ? {
           target: "pino-pretty",
           options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
              levelFirst: true,
           },
        }
      : undefined, // disable pretty logs in production
});
