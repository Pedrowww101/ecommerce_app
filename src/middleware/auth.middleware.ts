import { auth } from "../lib/auth.js";
import { factory } from "../lib/factory.js";

export const authMiddleware = factory.createMiddleware(async (c, next) => {
   try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      console.log(`[Auth Middleware] Session found: ${!!session}`);

      const authenticatedUser =
         session?.user && session.user.id ? session.user : null;

      c.set("user", authenticatedUser);
      c.set("session", session?.session ?? null);

      console.log(
         `[Auth Middleware] User context set to: ${
            authenticatedUser ? authenticatedUser.id : "NULL"
         }`
      );

      console.log(`Session token: ${session?.session.token}`);
   } catch (err) {
      console.error("Auth middleware error:", err);
      c.set("user", null);
      c.set("session", null);
   }
   await next();
});
