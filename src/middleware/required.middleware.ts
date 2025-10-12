import { factory } from "../lib/factory.js";
import { Unauthorized } from "../common/errors";

export const requiredAuthMiddleware = factory.createMiddleware(
   async (c, next) => {
      const user = c.get("user");

      if (!user || !user.id) {
         const error = new Unauthorized("A valid token is required.");
         return c.json(error.toResponse(), 401);
      }

      await next();
   }
);
