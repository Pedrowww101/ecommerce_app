import { roles, Permissions } from "../lib/access-control.js";
import { factory } from "../lib/factory.js";
import { Unauthorized, Forbidden } from "../common/errors/index.js";

type RoleKeys = keyof typeof roles;

type ResourceKeys = keyof Permissions;

export const roleAndPermissionMiddleware = (
   resource: ResourceKeys,
   action: string
) => {
   return factory.createMiddleware(async (c, next) => {
      const user = c.get("user");

      if (!user) {
         const error = new Unauthorized("User not authenticated");
         return c.json(error.toResponse(), 401);
      }

      const userRoleKey = user.role;

      if (!userRoleKey) {
         const error = new Forbidden("No role assigned to user");
         return c.json(error.toResponse(), 403);
      }

      const roleKey = userRoleKey as RoleKeys;

      if (!(roleKey in roles)) {
         const error = new Forbidden(`Unknown role '${userRoleKey}'`);
         return c.json(error.toResponse(), 403);
      }

      const roleObject = roles[roleKey];

      const allStatements = roleObject.statements as Record<ResourceKeys, any>;

      const resourcePermissions = allStatements[resource];

      const hasPermission =
         Array.isArray(resourcePermissions) &&
         resourcePermissions.includes(action as any);

      if (hasPermission) {
         await next();
      } else {
         const error = new Forbidden(
            `Insufficient privileges to ${action} ${resource}`
         );
         return c.json(error.toResponse(), 403);
      }
   });
};
