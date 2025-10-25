import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
   throw new Error("❌ Missing REDIS_URL in environment");
}

const redis = new Redis(REDIS_URL);

redis.on("connect", () => {
   console.log("✅ Connected to Redis!");
});

redis.on("error", (err) => {
   console.error("❌ Redis error:", err);
});

export default redis;
