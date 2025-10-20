import {
   pgTable,
   uuid,
   text,
   numeric,
   integer,
   timestamp,
   pgEnum,
   primaryKey,
   boolean,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema.js";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
   id: uuid("id").defaultRandom().primaryKey(),

   name: text("name").notNull(),
   slug: text("slug").notNull().unique(),
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
   updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
   }),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
   id: uuid("id").defaultRandom().primaryKey(),
   name: text("name").notNull().unique(),
   slug: text("slug").notNull().unique(),
   description: text("description"),
   createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
   }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
   shippingAddressId: uuid("shipping_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
   billingAddressId: uuid("billing_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
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

export const addresses = pgTable("addresses", {
   id: uuid("id").defaultRandom().primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

   // Address Details
   line1: text("line_1").notNull(),
   line2: text("line_2"),
   city: text("city").notNull(),
   state: text("state").notNull(),
   zipCode: text("zip_code").notNull(),
   country: text("country").notNull(),

   // Optional: for user to mark a default
   isDefault: boolean("is_default").default(false).notNull(),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 👇 Product relations
export const productRelations = relations(products, ({ many }) => ({
   categories: many(productCategories),
}));

// 👇 Category relations
export const categoryRelations = relations(categories, ({ many }) => ({
   products: many(productCategories),
}));

// 👇 The join table relations
export const productCategoryRelations = relations(
   productCategories,
   ({ one }) => ({
      product: one(products, {
         fields: [productCategories.productId],
         references: [products.id],
      }),
      category: one(categories, {
         fields: [productCategories.categoryId],
         references: [categories.id],
      }),
   })
);
