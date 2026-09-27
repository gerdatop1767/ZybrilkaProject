CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"year" integer,
	"description" text,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"variant_number" integer NOT NULL,
	"title" text NOT NULL,
	"year" integer,
	"status" text DEFAULT 'published' NOT NULL,
	"source_file" text,
	"source_page_start" integer,
	"source_page_end" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_tasks" ADD CONSTRAINT "variant_tasks_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_tasks" ADD CONSTRAINT "variant_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "variant_tasks_variant_task_idx" ON "variant_tasks" USING btree ("variant_id","task_id");--> statement-breakpoint
CREATE INDEX "variant_tasks_variant_position_idx" ON "variant_tasks" USING btree ("variant_id","position");--> statement-breakpoint
CREATE INDEX "variant_tasks_task_idx" ON "variant_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_collection_number_idx" ON "variants" USING btree ("collection_id","variant_number");