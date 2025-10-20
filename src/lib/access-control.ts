import { createAccessControl } from "better-auth/plugins/access";

export const permissions = {
   product: ["create", "view", "update", "remove"],
   category: ["create", "view", "update", "remove"],
   order: ["read", "updateStatus"],
} as const;

export type Permissions = typeof permissions;
const ac = createAccessControl(permissions);

export const roles = {
   user: ac.newRole({ product: ["view"], category: ["view"] }),
   admin: ac.newRole({
      product: [...permissions.product],
      category: [...permissions.category],
      order: [...permissions.order],
   }),
};

export { ac };
