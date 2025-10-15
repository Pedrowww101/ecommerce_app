import { Unauthorized } from "../common/errors/UnauthorizedError.js";
import { factory } from "../lib/factory.js";

export const requiredAuthMiddleware = factory.createMiddleware(
   async (c, next) => {
      const user = c.get("user");

      console.log(
         `[Required Auth] Checking user context: ${user ? user.id : "MISSING"}`
      );

      // This check should now correctly fail when user is 'null'
      if (!user || !user.id) {
         console.log(
            "[Required Auth] 🛑 BLOCKING REQUEST: Returning 401 UNAUTHORIZED"
         );
         const error = new Unauthorized("A valid token is required.");
         return c.json(error.toResponse(), 401);
      }

      console.log(`[Required Auth] ✅ User authenticated. Proceeding.`);
      await next();
   }
);
