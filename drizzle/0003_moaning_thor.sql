ALTER TABLE "settings" ALTER COLUMN "default_account_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "default_category_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "category_id" DROP NOT NULL;