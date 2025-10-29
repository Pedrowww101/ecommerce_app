import { createAccessControl } from "better-auth/plugins/access";

export const basePermission = ["create", "view", "update", "remove"] as const;
export const orderPermission = [...basePermission, "updateStatus"] as const;
export const cartPermission = [
   "addToCart",
   "removeToCart",
   "updateCartItems",
   "viewCart",
] as const;

export const permissions = {
   product: basePermission,
   category: basePermission,
   order: orderPermission,
   cart: cartPermission,
} as const;

const ac = createAccessControl(permissions);

export const roles = {
   user: ac.newRole({
      product: ["view"],
      category: ["view"],
      cart: [...permissions.cart],
   }),
   admin: ac.newRole({
      product: [...permissions.product],
      category: [...permissions.category],
      order: [...permissions.order],
      cart: [...permissions.cart],
   }),
};

export { ac };
