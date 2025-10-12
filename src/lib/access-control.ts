import { createAccessControl } from "better-auth/plugins/access";

export const permissions = {
   product: ["create", "read", "update", "delete"],
   category: ["create", "read", "update", "delete"],
   order: ["read", "updateStatus"],
} as const;

export type Permissions = typeof permissions;
const ac = createAccessControl(permissions);

export const roles = {
   user: ac.newRole({ product: ["read"] }),
   admin: ac.newRole({ product: ["create", "read", "update", "delete"] }),
};

export { ac };
