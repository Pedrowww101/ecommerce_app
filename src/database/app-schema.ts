import {
   pgTable,
   uuid,
   text,
   numeric,
   integer,
   timestamp,
   pgEnum,
   primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema.js";

export const products = pgTable("products", {
   id: uuid("id").defaultRandom().primaryKey(),

   name: text("name").notNull(),
   description: text("description"),
   price: numeric("price", {
      precision: 10,
      scale: 2,
      mode: "string",
   }).notNull(),
   stock: integer("stock").default(0).notNull(),
   imageUrl: text("image_url"),
   createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
   }),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
   id: uuid("id").defaultRandom().primaryKey(),
   name: text("name").notNull().unique(),
   description: text("description"),
});

export const productCategories = pgTable(
   "product_categories",
   {
      productId: uuid("product_id")
         .notNull()
         .references(() => products.id, { onDelete: "cascade" }),
      categoryId: uuid("category_id")
         .notNull()
         .references(() => categories.id, { onDelete: "cascade" }),
   },
   (t) => ({
      // Enforces a product can only be in a category once
      // and is highly efficient for lookups.
      pk: primaryKey({ columns: [t.productId, t.categoryId] }),
   })
);

export const carts = pgTable("carts", {
   id: uuid("id").defaultRandom().primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cartItems = pgTable(
   "cart_items",
   {
      cartId: uuid("cart_id")
         .notNull()
         .references(() => carts.id, { onDelete: "cascade" }),
      productId: uuid("product_id")
         .notNull()
         .references(() => products.id, { onDelete: "cascade" }),
      quantity: integer("quantity").notNull(),
   },
   (t) => ({
      // A cart can only have a specific product once
      pk: primaryKey({ columns: [t.cartId, t.productId] }),
   })
);

export const orderStatusEnum = pgEnum("order_status", [
   "pending",
   "paid",
   "shipped",
   "completed",
   "cancelled",
]);

export const orders = pgTable("orders", {
   id: uuid("id").defaultRandom().primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

   status: orderStatusEnum("status").default("pending").notNull(),
   totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
   id: uuid("id").defaultRandom().primaryKey(),
   orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
   productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
   quantity: integer("quantity").notNull(),
   unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});
