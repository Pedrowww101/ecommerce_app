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

export const orderStatusEnum = pgEnum("order_status", [
   "pending",
   "paid",
   "shipped",
   "completed",
   "cancelled",
]);
// ---------------------- ADDRESSES ----------------------
export const addresses = pgTable("addresses", {
   id: uuid("id").defaultRandom().primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

   line1: text("line_1").notNull(),
   line2: text("line_2"),
   city: text("city").notNull(),
   state: text("state").notNull(),
   zipCode: text("zip_code").notNull(),
   country: text("country").notNull(),

   isDefault: boolean("is_default").default(false).notNull(),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------- PRODUCTS ----------------------
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

// ---------------------- CATEGORIES ----------------------
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

// ---------------------- PRODUCT_CATEGORIES (Join Table) ----------------------
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

// ---------------------- CARTS ----------------------
export const carts = pgTable("carts", {
   id: uuid("id").defaultRandom().primaryKey(),
   userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------- CART_ITEMS ----------------------
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
      pk: primaryKey({ columns: [t.cartId, t.productId] }),
   })
);

// ---------------------- ORDERS ----------------------

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

// ---------------------- ORDER_ITEMS ----------------------
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

// ---------- USERS RELATIONS ----------
export const usersRelations = relations(users, ({ many }) => ({
   addresses: many(addresses),
   carts: many(carts),
   orders: many(orders),
   products: many(products),
   categories: many(categories),
}));

// ---------- ADDRESSES RELATIONS ----------
export const addressesRelations = relations(addresses, ({ one }) => ({
   user: one(users, {
      fields: [addresses.userId],
      references: [users.id],
   }),
}));

// ---------- PRODUCTS RELATIONS ----------
export const productsRelations = relations(products, ({ one, many }) => ({
   createdBy: one(users, {
      fields: [products.createdBy],
      references: [users.id],
   }),
   productCategories: many(productCategories),
   cartItems: many(cartItems),
   orderItems: many(orderItems),
}));

// ---------- CATEGORIES RELATIONS ----------
export const categoriesRelations = relations(categories, ({ one, many }) => ({
   createdBy: one(users, {
      fields: [categories.createdBy],
      references: [users.id],
   }),
   productCategories: many(productCategories),
}));

// ---------- PRODUCT_CATEGORIES RELATIONS ----------
export const productCategoriesRelations = relations(
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

// ---------- CARTS RELATIONS ----------
export const cartsRelations = relations(carts, ({ one, many }) => ({
   user: one(users, {
      fields: [carts.userId],
      references: [users.id],
   }),
   items: many(cartItems),
}));

// ---------- CART_ITEMS RELATIONS ----------
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
   cart: one(carts, {
      fields: [cartItems.cartId],
      references: [carts.id],
   }),
   product: one(products, {
      fields: [cartItems.productId],
      references: [products.id],
   }),
}));

// ---------- ORDERS RELATIONS ----------
export const ordersRelations = relations(orders, ({ one, many }) => ({
   user: one(users, {
      fields: [orders.userId],
      references: [users.id],
   }),
   orderItems: many(orderItems),
}));

// ---------- ORDER_ITEMS RELATIONS ----------
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
   order: one(orders, {
      fields: [orderItems.orderId],
      references: [orders.id],
   }),
   product: one(products, {
      fields: [orderItems.productId],
      references: [products.id],
   }),
}));
