-- Create product_reviews table safely
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "rating" numeric(2, 1) NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Add rating column to products table safely
DO $$ 
BEGIN
  ALTER TABLE "products" ADD COLUMN "rating" numeric(2, 1) DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

--> statement-breakpoint

-- Add FK: product_reviews → products
DO $$ 
BEGIN
  ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

-- Add FK: product_reviews → users
DO $$ 
BEGIN
  ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
