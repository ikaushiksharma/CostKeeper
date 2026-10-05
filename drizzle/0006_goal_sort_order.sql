ALTER TABLE "goals" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Keep the existing order (oldest first) for goals created before this column.
UPDATE "goals" SET "sort_order" = ranked.position
FROM (
	SELECT "id", (row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at", "id") - 1)::integer AS position
	FROM "goals"
) AS ranked
WHERE "goals"."id" = ranked."id";
