import { sql } from "drizzle-orm";
import type { BelloryClientConfigDraft } from "@/lib/server/config/client-config-schema";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const clientStatus = pgEnum("client_status", ["draft", "setup", "pilot", "live", "paused", "needs_attention"]);
export const memberRole = pgEnum("member_role", ["owner", "admin", "operator", "viewer"]);
export const leadStatus = pgEnum("lead_status", ["new", "qualifying", "needs_owner", "booked", "lost", "spam"]);
export const urgency = pgEnum("urgency", ["low", "medium", "high"]);
export const callStatus = pgEnum("call_status", ["ringing", "in_progress", "completed", "failed", "transferred"]);
export const appointmentStatus = pgEnum("appointment_status", ["held", "booked", "cancelled", "completed", "needs_approval"]);
export const providerStatus = pgEnum("provider_status", ["not_connected", "connected", "issue", "disabled"]);
export const issueSeverity = pgEnum("issue_severity", ["low", "medium", "high", "critical"]);
export const issueStatus = pgEnum("issue_status", ["open", "snoozed", "resolved"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export type ClientConfigSnapshot = BelloryClientConfigDraft;

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  clerkOrganizationId: text("clerk_organization_id"),
  ...timestamps,
}, (table) => ({
  slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
  clerkIdx: uniqueIndex("organizations_clerk_organization_id_idx").on(table.clerkOrganizationId),
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  ...timestamps,
}, (table) => ({
  clerkIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
  emailIdx: index("users_email_idx").on(table.email),
}));

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRole("role").default("operator").notNull(),
  ...timestamps,
}, (table) => ({
  membershipIdx: uniqueIndex("organization_members_org_user_idx").on(table.organizationId, table.userId),
}));

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  status: clientStatus("status").default("draft").notNull(),
  plan: text("plan").default("starter").notNull(),
  primaryContactName: text("primary_contact_name"),
  primaryContactPhone: text("primary_contact_phone"),
  primaryContactEmail: text("primary_contact_email"),
  timezone: text("timezone").default("America/Denver").notNull(),
  notes: text("notes"),
  ...timestamps,
}, (table) => ({
  orgIdx: index("clients_organization_id_idx").on(table.organizationId),
  statusIdx: index("clients_status_idx").on(table.status),
}));

export const clientConfigVersions = pgTable("client_config_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  status: text("status").default("draft").notNull(),
  config: jsonb("config").$type<ClientConfigSnapshot>().default({}).notNull(),
  promptPreview: text("prompt_preview"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => ({
  versionIdx: uniqueIndex("client_config_versions_client_version_idx").on(table.clientId, table.version),
  activeIdx: index("client_config_versions_client_status_idx").on(table.clientId, table.status),
}));

export const voiceProviderAccounts = pgTable("voice_provider_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").default("elevenlabs").notNull(),
  status: providerStatus("status").default("not_connected").notNull(),
  externalAccountId: text("external_account_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  orgProviderIdx: index("voice_provider_accounts_org_provider_idx").on(table.organizationId, table.provider),
}));

export const voiceAgents = pgTable("voice_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  providerAccountId: uuid("provider_account_id").references(() => voiceProviderAccounts.id, { onDelete: "set null" }),
  provider: text("provider").default("elevenlabs").notNull(),
  externalAgentId: text("external_agent_id"),
  externalVoiceId: text("external_voice_id"),
  displayName: text("display_name").notNull(),
  status: providerStatus("status").default("not_connected").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientIdx: index("voice_agents_client_id_idx").on(table.clientId),
  externalIdx: index("voice_agents_external_agent_id_idx").on(table.externalAgentId),
}));

export const phoneNumbers = pgTable("phone_numbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  voiceAgentId: uuid("voice_agent_id").references(() => voiceAgents.id, { onDelete: "set null" }),
  e164: text("e164").notNull(),
  provider: text("provider").default("twilio").notNull(),
  externalNumberId: text("external_number_id"),
  status: providerStatus("status").default("not_connected").notNull(),
  ...timestamps,
}, (table) => ({
  phoneIdx: uniqueIndex("phone_numbers_e164_idx").on(table.e164),
  clientIdx: index("phone_numbers_client_id_idx").on(table.clientId),
}));

export const calendarConnections = pgTable("calendar_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  provider: text("provider").default("google").notNull(),
  providerAccountEmail: text("provider_account_email"),
  primaryCalendarId: text("primary_calendar_id"),
  status: providerStatus("status").default("not_connected").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientProviderIdx: index("calendar_connections_client_provider_idx").on(table.clientId, table.provider),
}));

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  calendarConnectionId: uuid("calendar_connection_id").references(() => calendarConnections.id, { onDelete: "set null" }),
  externalEventId: text("external_event_id"),
  callerName: text("caller_name"),
  callerPhone: text("caller_phone"),
  serviceSummary: text("service_summary"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: appointmentStatus("status").default("held").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientTimeIdx: index("appointments_client_time_idx").on(table.clientId, table.startsAt),
}));

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  phoneNumberId: uuid("phone_number_id").references(() => phoneNumbers.id, { onDelete: "set null" }),
  voiceAgentId: uuid("voice_agent_id").references(() => voiceAgents.id, { onDelete: "set null" }),
  configVersionId: uuid("config_version_id").references(() => clientConfigVersions.id, { onDelete: "set null" }),
  provider: text("provider").default("elevenlabs").notNull(),
  externalCallId: text("external_call_id"),
  callerPhone: text("caller_phone"),
  callerName: text("caller_name"),
  status: callStatus("status").default("ringing").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  summary: text("summary"),
  outcome: text("outcome"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientIdx: index("calls_client_id_idx").on(table.clientId),
  externalIdx: index("calls_external_call_id_idx").on(table.externalCallId),
}));

export const callEvents = pgTable("call_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").notNull().references(() => calls.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  callIdx: index("call_events_call_id_idx").on(table.callId),
}));

export const callTranscriptMessages = pgTable("call_transcript_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").notNull().references(() => calls.id, { onDelete: "cascade" }),
  speaker: text("speaker").notNull(),
  text: text("text").notNull(),
  startedAtMs: integer("started_at_ms"),
  endedAtMs: integer("ended_at_ms"),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  callIdx: index("call_transcript_messages_call_id_idx").on(table.callId),
}));

export const agentToolCalls = pgTable("agent_tool_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  toolName: text("tool_name").notNull(),
  requestPayload: jsonb("request_payload").$type<Record<string, unknown>>().default({}).notNull(),
  responsePayload: jsonb("response_payload").$type<Record<string, unknown>>().default({}).notNull(),
  status: text("status").default("success").notNull(),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  toolIdx: index("agent_tool_calls_tool_name_idx").on(table.toolName),
  callIdx: index("agent_tool_calls_call_id_idx").on(table.callId),
}));

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  name: text("name"),
  phone: text("phone").notNull(),
  issue: text("issue"),
  urgency: urgency("urgency").default("medium").notNull(),
  status: leadStatus("status").default("new").notNull(),
  estimatedValueCents: integer("estimated_value_cents"),
  summary: text("summary"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientStatusIdx: index("leads_client_status_idx").on(table.clientId, table.status),
  phoneIdx: index("leads_phone_idx").on(table.phone),
}));

export const ownerNotifications = pgTable("owner_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").default("queued").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  ...timestamps,
});

export const clientIssues = pgTable("client_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  severity: issueSeverity("severity").default("medium").notNull(),
  status: issueStatus("status").default("open").notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  actionLabel: text("action_label"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  orgStatusIdx: index("client_issues_org_status_idx").on(table.organizationId, table.status),
  clientStatusIdx: index("client_issues_client_status_idx").on(table.clientId, table.status),
  severityIdx: index("client_issues_severity_idx").on(table.severity),
}));

export const clientDailyMetrics = pgTable("client_daily_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  metricDate: date("metric_date").notNull(),
  callsAnswered: integer("calls_answered").default(0).notNull(),
  appointmentsBooked: integer("appointments_booked").default(0).notNull(),
  jobsSaved: integer("jobs_saved").default(0).notNull(),
  estimatedRevenueCents: integer("estimated_revenue_cents").default(0).notNull(),
  hoursSavedMinutes: integer("hours_saved_minutes").default(0).notNull(),
  urgentHandoffs: integer("urgent_handoffs").default(0).notNull(),
  toolFailures: integer("tool_failures").default(0).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => ({
  clientDateIdx: uniqueIndex("client_daily_metrics_client_date_idx").on(table.clientId, table.metricDate),
}));

export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});

export const automationRuns = pgTable("automation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  automationRuleId: uuid("automation_rule_id").references(() => automationRules.id, { onDelete: "set null" }),
  status: text("status").default("queued").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const billingCustomers = pgTable("billing_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  ...timestamps,
}, (table) => ({
  customerIdx: uniqueIndex("billing_customers_stripe_customer_id_idx").on(table.stripeCustomerId),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEndsAt: timestamp("current_period_ends_at", { withTimezone: true }),
  ...timestamps,
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  stripeInvoiceId: text("stripe_invoice_id").notNull(),
  status: text("status").notNull(),
  amountDueCents: integer("amount_due_cents").notNull(),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  actorType: text("actor_type").default("system").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgCreatedIdx: index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt),
}));

export const evalScenarios = pgTable("eval_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  vertical: text("vertical"),
  prompt: text("prompt").notNull(),
  expectedOutcome: jsonb("expected_outcome").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});

export const evalRuns = pgTable("eval_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  evalScenarioId: uuid("eval_scenario_id").notNull().references(() => evalScenarios.id, { onDelete: "cascade" }),
  voiceAgentId: uuid("voice_agent_id").references(() => voiceAgents.id, { onDelete: "set null" }),
  status: text("status").default("queued").notNull(),
  score: numeric("score", { precision: 6, scale: 4 }),
  result: jsonb("result").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schemaVersion = sql`2026_06_19_initial_backend_foundation`;
