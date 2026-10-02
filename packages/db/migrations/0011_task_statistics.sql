CREATE TABLE "task_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"correct_attempts" integer DEFAULT 0 NOT NULL,
	"incorrect_attempts" integer DEFAULT 0 NOT NULL,
	"accuracy" integer,
	"difficulty" integer,
	"confidence" integer DEFAULT 0 NOT NULL,
	"average_time_ms" integer,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_statistics" ADD CONSTRAINT "task_statistics_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "task_statistics_task_idx" ON "task_statistics" USING btree ("task_id");