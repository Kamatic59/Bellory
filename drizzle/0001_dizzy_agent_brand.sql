CREATE TYPE "public"."issue_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('open', 'snoozed', 'resolved');--> statement-breakpoint
CREATE TABLE "client_daily_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"calls_answered" integer DEFAULT 0 NOT NULL,
	"appointments_booked" integer DEFAULT 0 NOT NULL,
	"jobs_saved" integer DEFAULT 0 NOT NULL,
	"estimated_revenue_cents" integer DEFAULT 0 NOT NULL,
	"hours_saved_minutes" integer DEFAULT 0 NOT NULL,
	"urgent_handoffs" integer DEFAULT 0 NOT NULL,
	"tool_failures" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"severity" "issue_severity" DEFAULT 'medium' NOT NULL,
	"status" "issue_status" DEFAULT 'open' NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"action_label" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolved_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_daily_metrics" ADD CONSTRAINT "client_daily_metrics_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_issues" ADD CONSTRAINT "client_issues_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_issues" ADD CONSTRAINT "client_issues_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "client_daily_metrics_client_date_idx" ON "client_daily_metrics" USING btree ("client_id","metric_date");--> statement-breakpoint
CREATE INDEX "client_issues_org_status_idx" ON "client_issues" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "client_issues_client_status_idx" ON "client_issues" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "client_issues_severity_idx" ON "client_issues" USING btree ("severity");