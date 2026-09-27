ALTER TABLE "tasks" ADD COLUMN "source_document" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source_variant" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source_page" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "raw_statement" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "content_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_content_hash_idx" ON "tasks" USING btree ("content_hash");