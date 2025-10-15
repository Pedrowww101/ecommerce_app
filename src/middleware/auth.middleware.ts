import { auth } from "../lib/auth.js";
import { factory } from "../lib/factory.js";

export const authMiddleware = factory.createMiddleware(async (c, next) => {
   try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      console.log(`[Auth Middleware] Session found: ${!!session}`);

      // ⭐ THIS IS THE CRITICAL LINE TO CHANGE:
      // Only assign the user object if it exists AND it has an 'id'.
      const authenticatedUser =
         session?.user && session.user.id ? session.user : null;

      // Set the context to the valid user or null
      c.set("user", authenticatedUser);
      c.set("session", session?.session ?? null);

      console.log(
         `[Auth Middleware] User context set to: ${
            authenticatedUser ? authenticatedUser.id : "NULL"
         }`
      );
   } catch (err) {
      console.error("Auth middleware error:", err);
      c.set("user", null);
      c.set("session", null);
   }
   await next();
});
