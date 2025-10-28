ALTER TABLE "cart_items" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;