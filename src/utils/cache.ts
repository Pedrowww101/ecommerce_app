import { redis } from "../lib/redis.js";

export const cache = {
   async get<T>(key: string): Promise<T | null> {
      try {
         const data = await redis.get(key);
         if (!data) return null;
         return JSON.parse(data) as T;
      } catch (err) {
         console.warn(`⚠️ Failed to parse cache key [${key}]:`, err);
         return null;
      }
   },

   async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const json = JSON.stringify(value);
      if (ttlSeconds) {
         await redis.setEx(key, ttlSeconds, json);
      } else {
         await redis.set(key, json);
      }
   },

   async delByPrefix(prefix: string): Promise<void> {
      const pattern = `${prefix}:*`;
      const keysToDelete: string[] = [];

      try {
         // Scan keys matching the prefix
         for await (const key of redis.scanIterator({
            MATCH: pattern,
            COUNT: 100,
         })) {
            if (typeof key === "string") keysToDelete.push(key);
         }

         if (keysToDelete.length === 0) {
            console.log(`🗑️ No cache keys found with prefix: ${prefix}`);
            return;
         }

         // Delete keys in batches using pipeline for efficiency
         const batchSize = 50;
         for (let i = 0; i < keysToDelete.length; i += batchSize) {
            const batch = keysToDelete.slice(i, i + batchSize);
            if (batch.length === 0) continue;

            const pipeline = redis.multi();
            batch.forEach((key) => pipeline.del(key));

            try {
               await pipeline.exec();
            } catch (err) {
               console.error(
                  `⚠️ Failed to delete batch of cache keys with prefix '${prefix}':`,
                  err
               );
            }
         }

         console.log(
            `🗑️ Deleted ${keysToDelete.length} cache key(s) with prefix '${prefix}'`
         );
      } catch (err) {
         console.error(
            `⚠️ Error scanning cache keys with prefix '${prefix}':`,
            err
         );
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
