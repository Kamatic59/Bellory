CREATE TYPE "public"."sales_dial_outcome" AS ENUM('no_answer', 'voicemail', 'gatekeeper', 'conversation', 'demo_committed', 'pilot_agreed', 'became_paying', 'not_fit');--> statement-breakpoint
CREATE TYPE "public"."sales_prospect_status" AS ENUM('untouched', 'working', 'demo_sent', 'pilot', 'paying', 'not_fit');--> statement-breakpoint
CREATE TABLE "sales_dials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"outcome" "sales_dial_outcome" NOT NULL,
	"caller" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"phone" text,
	"alt_phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"area" text,
	"tier" integer DEFAULT 1 NOT NULL,
	"research" text,
	"angle" text,
	"status" "sales_prospect_status" DEFAULT 'untouched' NOT NULL,
	"next_action_at" timestamp with time zone,
	"notes" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_dials" ADD CONSTRAINT "sales_dials_prospect_id_sales_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."sales_prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_dials_prospect_id_idx" ON "sales_dials" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "sales_dials_created_at_idx" ON "sales_dials" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_prospects_company_idx" ON "sales_prospects" USING btree ("company");--> statement-breakpoint
CREATE INDEX "sales_prospects_status_idx" ON "sales_prospects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sales_prospects_next_action_idx" ON "sales_prospects" USING btree ("next_action_at");