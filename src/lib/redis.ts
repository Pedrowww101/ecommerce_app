import { createClient } from "redis";

export const redis = createClient({
   username: "default",
   password: "OBlDbbAZYQD2zLGqXCmeN7DrCzxRZTIN",
   socket: {
      host: "redis-11773.crce178.ap-east-1-1.ec2.redns.redis-cloud.com",
      port: 11773,
   },
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();
