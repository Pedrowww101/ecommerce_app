import { createAccessControl } from "better-auth/plugins/access"

const permissions = {
    product: ["create", "read", "update", "delete"],
    category: ["create", "read", "update", "delete"],
    order: ["read", "updateStatus"],
  } as const;

const ac = createAccessControl(permissions)

export const userRole = ac.newRole({
    product: ["read"],
  });
  
  export const adminRole = ac.newRole({
    product: ["create", "read", "update", "delete"],
  });

export { ac }