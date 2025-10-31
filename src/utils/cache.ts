import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js"; // ✅ import logger once

export const cache = {
   async get<T>(key: string): Promise<T | null> {
      try {
         const data = await redis.get(key);
         if (!data) return null;
         return JSON.parse(data) as T;
      } catch (err) {
         logger.warn({ err, key }, "Failed to parse cache value");
         return null;
      }
   },

   async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      const json = JSON.stringify(value);
      try {
         if (ttlSeconds) {
            await redis.setEx(key, ttlSeconds, json);
         } else {
            await redis.set(key, json);
         }
         logger.debug({ key, ttlSeconds }, "Cache set successfully");
      } catch (err) {
         logger.error({ err, key }, "Failed to set cache value");
      }
   },

   async delByPrefix(prefix: string): Promise<void> {
      const pattern = `${prefix}:*`;
      const keysToDelete: string[] = [];

      logger.debug({ pattern }, "[CACHE] Searching cache keys by prefix");

      try {
         for await (const key of redis.scanIterator({
            MATCH: pattern,
            COUNT: 100,
         })) {
            if (typeof key === "string") {
               keysToDelete.push(key);
               logger.trace({ key }, "[CACHE] Found key");
            }
         }

         if (keysToDelete.length === 0) {
            logger.info({ prefix }, "[CACHE] No cache keys found for prefix");
            return;
         }

         logger.info(
            { prefix, count: keysToDelete.length },
            "[CACHE] Deleting cache keys"
         );

         // Delete in batches
         const batchSize = 50;
         for (let i = 0; i < keysToDelete.length; i += batchSize) {
            const batch = keysToDelete.slice(i, i + batchSize);
            const pipeline = redis.multi();
            batch.forEach((key) => pipeline.del(key));

            try {
               await pipeline.exec();
               logger.debug(
                  { batchCount: batch.length },
                  "[CACHE] Deleted batch"
               );
            } catch (err) {
               logger.error({ err, prefix }, "[CACHE] Failed to delete batch");
            }
         }

         logger.info(
            { prefix, totalDeleted: keysToDelete.length },
            "[CACHE] Completed deletion"
         );
      } catch (err) {
         logger.error({ err, prefix }, "[CACHE] Error scanning cache keys");
      }
   },

   async remember<T>(
      key: string,
      ttlSeconds: number,
      fetcher: () => Promise<T>
   ): Promise<T> {
      const start = Date.now();

      const cached = await this.get<T>(key);
      if (cached) {
         logger.info({
            msg: "CACHE HIT",
            key,
            latencyMs: Date.now() - start,
         });
         return cached;
      }

      logger.warn({
         msg: "CACHE MISS – fetching fresh data",
         key,
      });

      const result = await fetcher();
      await this.set(key, result, ttlSeconds);

      logger.debug({
         msg: "Cache set successfully",
         key,
         ttlSeconds,
         latencyMs: Date.now() - start,
      });

      return result;
   },
};
