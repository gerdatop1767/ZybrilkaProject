ALTER TABLE "learning_sessions" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD COLUMN "planned_task_ids" jsonb;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;