import { factory } from "@/lib/factory";

export const adminOnly = factory.createMiddleware(async (c, next) => {
    const user = c.get("user");

    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }

    if (user.role !== "admin") {
        return c.json({ message: "Forbidden" }, 403);
    }

    await next();
});