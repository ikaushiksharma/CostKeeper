DO $$ BEGIN
 CREATE TYPE "public"."goal_cadence" AS ENUM('month', 'quarter', 'half_year', 'year', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_carry" AS ENUM('none', 'surplus', 'shortfall', 'both');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_kind" AS ENUM('save', 'payoff', 'allowance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_role" AS ENUM('contribution', 'target');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goal_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"goal_id" text NOT NULL,
	"label" text,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"target_amount" integer NOT NULL,
	"carry_in" integer DEFAULT 0 NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "goal_kind" NOT NULL,
	"cadence" "goal_cadence" DEFAULT 'half_year' NOT NULL,
	"carry_over" "goal_carry" DEFAULT 'both' NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"category_id" text,
	"account_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"archived_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "goal_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "goal_role" "goal_role";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_periods" ADD CONSTRAINT "goal_periods_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "goal_periods_goal_start_idx" ON "goal_periods" ("goal_id","starts_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "goals_user_status_idx" ON "goals" ("user_id","status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_goal_idx" ON "transactions" ("goal_id");