import { createAccessControl } from "better-auth/plugins/access";

export const basePermission = ["create", "view", "update", "remove"] as const;
export const orderPermission = [...basePermission, "updateStatus"] as const;

export const permissions = {
   product: basePermission,
   category: basePermission,
   order: orderPermission,
} as const;

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
