import { cors } from "hono/cors";

export const authCorsMiddleware = () => {
   return cors({
      origin: (origin) => {
         // ✅ Define your allowed origins (no trailing slashes)
         const allowedOrigins = [
            "http://localhost:5173", // frontend (dev)
            "http://localhost:3000", // backend (dev)
            "https://biligo.vercel.app", // frontend (prod)
            "https://ecommerce-app-g6ed.onrender.com", // backend (prod)
         ];

         // ✅ Allow if request's Origin matches one of these
         if (origin && allowedOrigins.includes(origin)) {
            return origin;
         }

         // ❌ Return null (not empty string) when disallowed
         // Empty string breaks the CORS response — null tells Hono to skip adding the header
         return null;
      },

      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      credentials: true,
      maxAge: 600,
   });
};
