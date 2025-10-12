# Routes Structure

This directory contains the routing structure for the application, organized by access level.

## Structure

```
src/routes/
├── index.ts                 # Route exports
├── public/                  # Public routes (no authentication required)
│   └── product.routes.ts    # Public product endpoints
└── protected/               # Protected routes (authentication required)
    ├── route.ts             # Base protected route with auth middleware
    └── product.routes.ts    # Protected product endpoints
```

## URL Structure

### Public Routes

-  `GET /api/products` - Get all products (public access)

### Protected Routes

-  `POST /api/protected/products/add` - Add new product (requires authentication + product:create permission)

## Middleware Flow

1. **Global Auth Middleware**: Sets user context for all routes
2. **Required Auth Middleware**: Applied to `/protected/*` routes to enforce authentication
3. **Role Permission Middleware**: Applied to specific endpoints for authorization

## Adding New Routes

### Public Routes

Create a new file in `src/routes/public/` and export it from `src/routes/index.ts`

### Protected Routes

Create a new file in `src/routes/protected/` and export it from `src/routes/index.ts`

Example:

```typescript
// src/routes/protected/user.routes.ts
import { Hono } from "hono";
import { Env } from "../../lib/auth.type";
import { roleAndPermissionMiddleware } from "../../middleware/role-permission.middleware";

const protectedUserRoutes = new Hono<Env>().get(
   "/profile",
   roleAndPermissionMiddleware("user", "read"),
   ...getProfileController
);

export default protectedUserRoutes;
```

Then add to `src/routes/index.ts`:

```typescript
export { default as protectedUserRoutes } from "./protected/user.routes";
```

And register in `src/index.ts`:

```typescript
.route("/protected/users", protectedUserRoutes);
```
