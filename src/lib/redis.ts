import { Redis } from "ioredis";

// use a single REDIS_URL variable for production
const REDIS_URL = process.env.REDIS_URL;

let redis: Redis;

if (REDIS_URL) {
   // ✅ for Render or Redis Cloud (uses rediss://... connection)
   redis = new Redis(REDIS_URL, {
      tls: {
         rejectUnauthorized: false,
      }, // required for Redis Cloud SSL
   });
} else {
   // ✅ fallbacks
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
