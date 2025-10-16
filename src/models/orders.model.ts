import {
   createInsertSchema,
   createUpdateSchema,
   createSelectSchema,
} from "drizzle-arktype";
import { orders } from "../database/app-schema.js";

export const ordersSchema = createSelectSchema(orders);
export const insertOrdersSchema = createInsertSchema(orders, {});
export const updateOrdersSchema = createUpdateSchema(orders);
