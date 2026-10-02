CREATE TABLE "user_error_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"error_signature" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_occurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_error_statistics" ADD CONSTRAINT "user_error_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_error_statistics_user_signature_idx" ON "user_error_statistics" USING btree ("user_id","error_signature");