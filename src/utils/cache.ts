import redis from "../lib/redis.js";

export const cache = {
   async get<T>(key: string): Promise<T | null> {
      const data = await redis.get(key);
      if (!data) return null;
      try {
         return JSON.parse(data) as T;
      } catch (err) {
         console.warn(`⚠️ Failed to parse cache key [${key}]:`, err);
         return null;
      }
   },

   async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const json = JSON.stringify(value);
      if (ttlSeconds) {
         await redis.setex(key, ttlSeconds, json);
      } else {
         await redis.set(key, json);
      }
   },

   async delByPrefix(prefix: string): Promise<void> {
      const pattern = `${prefix}:*`;
      let cursor = 0;
      const keysToDelete: string[] = [];

      do {
         const [nextCursor, keys] = await redis.scan(
            cursor,
            "MATCH",
            pattern,
            "COUNT",
            100
         );
         cursor = Number(nextCursor);
         if (keys.length > 0) keysToDelete.push(...keys);
      } while (cursor !== 0);

      if (keysToDelete.length > 0) {
         await redis.del(...(keysToDelete as [string, ...string[]]));
         console.log(
            `🗑️ Cache keys deleted with prefix '${pattern}':`,
            keysToDelete
         );
      } else {
         console.log(`🗑️ No cache keys found with prefix: ${pattern}`);
      }
   },

   async remember<T>(
      key: string,
      ttlSeconds: number,
      fetcher: () => Promise<T>
   ): Promise<T> {
      const cached = await this.get<T>(key);
      if (cached) {
         console.log(`✅ CACHE HIT: Key [${key}]`);
         return cached;
      }

      console.log(`❌ CACHE MISS: Key [${key}]. Fetching fresh data...`);
      const fresh = await fetcher();

      await this.set(key, fresh, ttlSeconds);
      return fresh;
   },
};
