import { Unauthorized } from "../common/errors/UnauthorizedError.js";
import { factory } from "../lib/factory.js";

export const requiredAuthMiddleware = factory.createMiddleware(
   async (c, next) => {
      const user = c.get("user");

      // This check should now correctly fail when user is 'null'
      if (!user || !user.id) {
         const error = new Unauthorized("A valid token is required.");
         return c.json(error.toResponse(), 401);
      }

      await next();
   }
);
