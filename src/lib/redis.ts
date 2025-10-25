import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis;

if (REDIS_URL) {
   // ✅ For Redis Cloud (requires TLS + rediss://)
   redis = new Redis(REDIS_URL, {
      tls: {
         servername:
            "redis-11773.crce178.ap-east-1-1.ec2.redns.redis-cloud.com",
      },
   });
} else {
   // ✅ Fallback for local dev
   const REDIS_HOST = process.env.REDIS_HOST || "localhost";
   const REDIS_PORT = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT)
      : 6379;

   redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
   });
}

redis.on("connect", () => {
   console.log("✅ Successfully connected to Redis!");
});

redis.on("error", (err) => {
   console.error("❌ Redis error:", err);
});

export default redis;
