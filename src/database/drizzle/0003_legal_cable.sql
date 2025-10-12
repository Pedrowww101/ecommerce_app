ALTER TABLE "products" DROP CONSTRAINT "products_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_by" DROP NOT NULL;