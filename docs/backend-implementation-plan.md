# Bellory Backend Implementation Plan

Last updated: June 22, 2026

## Product Goal

Bellory is an admin-run AI receptionist platform for service businesses. A Bellory operator onboards each business, configures everything the AI receptionist needs to answer calls safely, connects phone/calendar/voice providers, launches the receptionist, monitors issues, and proves value with jobs saved, calls answered, revenue influenced, and hours saved.

The current frontend is intentionally shaped around the backend we need:

- **Accounts:** find every client and see high-level readiness/results.
- **New Business Setup:** 12-step onboarding that captures the full AI receptionist configuration.
- **Account Detail:** per-business settings, configuration, testing, calls/jobs, and stats.
- **Issues:** actionable setup/runtime problems that need an operator.
- **Reports:** client-facing proof of value.
- **Settings:** workspace/provider readiness.

Backend work should make every visible control real, but the first priority is the configuration engine that powers live calls.

## Current Repo Foundation

Already present:

- Next.js app deployed through Vercel.
- Drizzle schema in `src/db/schema.ts`.
- Generated migration in `drizzle/`.
- Stubbed agent tool route: `POST /api/agent-tools/[...tool]`.
- Stubbed post-call and provider webhook routes.
- Service setup checklist in `docs/service-setup-checklist.md`.
- Deployment status in `docs/deployment-status.md`.

Important existing schema pieces:

- `organizations`, `users`, `organization_members`
- `clients`
- `client_config_versions`
- `voice_provider_accounts`, `voice_agents`
- `phone_numbers`
- `calendar_connections`, `appointments`
- `calls`, `call_events`, `call_transcript_messages`
- `agent_tool_calls`
- `leads`
- `owner_notifications`
- `automation_rules`, `automation_runs`
- `audit_logs`
- `eval_scenarios`, `eval_runs`

This is a good foundation. The main change is expanding the client config shape to match the new onboarding/settings UI.

## Architecture Decision

Use a **versioned configuration engine** as the source of truth.

Each client has draft and published config versions. The admin app edits a draft. Publishing validates it, builds the AI receptionist prompt/tool config, syncs it to ElevenLabs, and records a new active version. Every live call stores the config version used.

MVP storage strategy:

- Use `client_config_versions.config` as the canonical versioned JSON snapshot.
- Validate it with a strict Zod schema before save/publish.
- Keep operational provider entities normalized where they already exist: phone numbers, voice agents, calendar connections, calls, leads, appointments.
- Add normalized tables only where querying/reporting requires them, such as issues, daily metrics, and provider connection health.

This avoids table sprawl early while still giving us clean backend contracts.

## Client Config Shape

The published config should map directly to the 12 onboarding steps.

```ts
type BelloryClientConfig = {
  businessIdentity: {
    legalName: string;
    publicName: string;
    industry: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string;
    timezone: string;
    brandTone: string[];
    businessSummary: string;
  };
  locationsAndHours: {
    primaryAddress?: string;
    serviceAreas: Array<{ city?: string; zip?: string; radiusMiles?: number }>;
    normalHours: Record<string, Array<{ open: string; close: string }>>;
    emergencyHours?: Record<string, unknown>;
    holidays: Array<{ date: string; behavior: string }>;
    outOfAreaResponse: string;
  };
  phoneRouting: {
    mode: "forward_existing" | "new_number" | "port_later";
    currentNumber?: string;
    belloryNumber?: string;
    callerIdLabel?: string;
    recordingConsentMode: "one_party" | "two_party" | "disabled" | "custom";
    missedCallFallback: string;
    spamHandling: string;
  };
  aiVoice: {
    provider: "elevenlabs";
    providerAccountId?: string;
    externalAgentId?: string;
    externalVoiceId?: string;
    greetingScript: string;
    speakingPace: string;
    interruptionStyle: string;
    backgroundAmbience?: string;
    disclosurePhrase: string;
    behaviorInstructions: string;
  };
  receptionistBrain: {
    callerIntents: string[];
    requiredIntakeFields: string[];
    faqs: Array<{ question: string; answer: string }>;
    wordsToAvoid: string[];
    forbiddenClaims: string[];
    lowConfidencePolicy: string;
  };
  servicesAndPricing: {
    services: Array<{
      name: string;
      active: boolean;
      description?: string;
      requiredQuestions: string[];
      startingPriceCents?: number;
      priceRangeCents?: { min: number; max: number };
    }>;
    diagnosticFees: Array<{ label: string; amountCents: number }>;
    quoteGuardrails: string[];
    neverQuoteConditions: string[];
    ownerApprovalThresholdCents?: number;
  };
  qualificationRules: {
    requiredCallerInfo: string[];
    requiredIssueDetails: string[];
    photoRequestRules: string[];
    propertyTypeQuestions: string[];
    leadScoreRules: Array<{ rule: string; points: number }>;
    doNotBookConditions: string[];
  };
  calendarAndDispatch: {
    provider: "google" | "manual" | "none";
    bookingMode: "direct" | "owner_approval" | "lead_only";
    appointmentTypes: Array<{ name: string; durationMinutes: number }>;
    travelBufferMinutes: number;
    appointmentWindowWording: string;
    technicianRoutingRules: string[];
    noAvailabilityBehavior: string;
  };
  urgencyAndEscalation: {
    urgentTriggers: string[];
    primaryFallbackContactId?: string;
    secondaryFallbackContactId?: string;
    transferHours?: Record<string, unknown>;
    smsAlertTemplate: string;
    operatorReviewThreshold: string;
  };
  complianceAndPolicies: {
    aiDisclosurePolicy: string;
    callRecordingConsentScript: string;
    dataRetentionDays: number;
    safetyDisclaimerRules: string[];
    prohibitedAdvice: string[];
    complaintHandlingScript: string;
    paymentInfoPolicy: string;
  };
  integrations: {
    elevenLabs: { status: string; externalAgentId?: string };
    twilio: { status: string; phoneNumberId?: string };
    googleCalendar: { status: string; connectionId?: string };
    crm?: { status: string; provider?: string };
  };
  launchQa: {
    requiredScenarios: string[];
    lastRunId?: string;
    passed: boolean;
    approvedByUserId?: string;
    publishedAt?: string;
  };
};
```

## App Page Backend Mapping

### Accounts

Backend responsibilities:

- Query clients for the current organization.
- Show status, plan, phone/calendar/AI health, setup progress, open issue count, jobs saved, calls answered, hours saved.
- Search/filter clients.
- Open a client into Account Detail.

Required endpoints/actions:

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:clientId/summary`

Data sources:

- `clients`
- latest `client_config_versions`
- `phone_numbers`
- `voice_agents`
- `calendar_connections`
- aggregated `calls`, `leads`, `appointments`
- new `client_issues` or issue view

### New Business Setup

Backend responsibilities:

- Create draft client.
- Save each of the 12 steps independently.
- Validate required fields by step.
- Track readiness percentage.
- Publish only when required config, provider connections, and launch QA pass.

Required endpoints/actions:

- `POST /api/clients/onboarding`
- `PATCH /api/clients/:clientId/config/draft`
- `POST /api/clients/:clientId/config/validate`
- `POST /api/clients/:clientId/config/publish`
- `POST /api/clients/:clientId/config/rollback`

Data sources:

- `clients`
- `client_config_versions`
- `audit_logs`
- `voice_agents`
- `phone_numbers`
- `calendar_connections`
- `eval_runs`

### Account Detail

Backend responsibilities:

- Load a selected client and its latest draft/published config.
- Allow editing all tabs:
  - Business Brain
  - AI Voice
  - Call Flow
  - Services & Pricing
  - Calendar & Dispatch
  - Urgency & Fallbacks
  - Knowledge Base
  - Compliance
  - Integrations
  - Testing
  - Calls & Jobs
  - Stats
- Save config changes as draft.
- Publish config to live AI agent.
- Show which config version is live.

Required endpoints/actions:

- `GET /api/clients/:clientId`
- `GET /api/clients/:clientId/config`
- `PATCH /api/clients/:clientId/config/draft`
- `POST /api/clients/:clientId/config/publish`
- `GET /api/clients/:clientId/calls`
- `GET /api/clients/:clientId/leads`
- `GET /api/clients/:clientId/stats`

### Issues

Backend responsibilities:

- Surface only operator-actionable problems.
- Create issues from failed setup validations, provider errors, webhook failures, tool failures, bad calendar sync, failed transfers, failed notifications, and low-confidence calls.
- Resolve/snooze/assign issues.

Add table:

- `client_issues`
  - `id`
  - `organization_id`
  - `client_id`
  - `severity`
  - `status`
  - `source`
  - `title`
  - `description`
  - `action_label`
  - `metadata`
  - `resolved_at`
  - timestamps

Required endpoints/actions:

- `GET /api/issues`
- `POST /api/issues`
- `PATCH /api/issues/:issueId`

### Reports

Backend responsibilities:

- Produce client-facing proof of value.
- Track calls answered, missed calls avoided, jobs saved, appointments booked, estimated revenue, urgent handoffs, hours saved, and issue resolution.
- Export/share monthly reports later.

Add table or materialized aggregation:

- `client_daily_metrics`
  - `client_id`
  - `date`
  - `calls_answered`
  - `appointments_booked`
  - `jobs_saved`
  - `estimated_revenue_cents`
  - `hours_saved_minutes`
  - `urgent_handoffs`
  - `tool_failures`

Required endpoints/actions:

- `GET /api/reports/overview`
- `GET /api/clients/:clientId/report`
- `POST /api/reports/monthly/generate`

### Settings

Backend responsibilities:

- Workspace settings.
- Provider connection status.
- Environment readiness.
- Team/role management later.

Required endpoints/actions:

- `GET /api/settings/workspace`
- `PATCH /api/settings/workspace`
- `GET /api/settings/providers`
- `POST /api/settings/providers/:provider/connect`

## Voice Runtime Plan

Primary MVP runtime:

- ElevenLabs Conversational AI for live voice agent.
- Twilio phone numbers connected through ElevenLabs native phone integration.
- Bellory Vercel API routes as webhook tools.
- Google Calendar API for availability and booking.
- Inngest for post-call processing and retries.

Live call flow:

1. Caller dials client number.
2. Twilio routes to ElevenLabs agent.
3. ElevenLabs starts call with the client’s published config.
4. Agent uses Bellory tool endpoints:
   - `client-context`
   - `classify-urgency`
   - `service-area`
   - `calendar/availability`
   - `calendar/hold`
   - `calendar/book`
   - `leads/upsert`
   - `owner-alert`
   - `transfer-request`
5. Bellory logs every tool call to `agent_tool_calls`.
6. Post-call webhook stores call summary, transcript, recording URL, outcome, lead, appointment, and issues.
7. Inngest jobs normalize the call, update reports, send notifications, and flag low-confidence calls.

## Prompt and Agent Config Builder

Add a backend module:

```text
src/lib/server/config/
  client-config-schema.ts
  config-validation.ts
  prompt-builder.ts
  elevenlabs-agent-builder.ts
  readiness-score.ts
```

Responsibilities:

- Validate every config draft with Zod.
- Compute setup/readiness percentage.
- Build the receptionist prompt from structured config.
- Build dynamic variables/tool context for ElevenLabs.
- Generate a voice-agent sync payload.
- Detect missing fields before publish.
- Create actionable issues when validation fails.

Prompt must include:

- business identity
- service area
- hours
- greeting
- voice style
- required intake questions
- qualification rules
- services and pricing guardrails
- calendar booking behavior
- urgency and escalation rules
- compliance/disclosure/recording policy
- forbidden claims
- tool usage rules
- call closeout behavior

Prompt must not include:

- secrets
- OAuth tokens
- private admin notes that should never be spoken
- raw database IDs unless needed by tools

## Database Work Needed

Keep current schema, then add:

1. Expand `ClientConfigSnapshot` type to the full `BelloryClientConfig`.
2. Add `client_issues`.
3. Add `client_daily_metrics`.
4. Add `config_publish_events` if audit logs are not enough.
5. Add optional `client_contacts` for fallback/owner/manager/operator contacts.
6. Add optional `knowledge_items` if we want searchable knowledge outside the config JSON.
7. Add optional `service_catalog_items` only if reports/filtering need service-level queries soon.

MVP recommendation:

- Do not create separate tables for every config section yet.
- Store versioned config JSON.
- Normalize only provider/runtime/reporting data.
- Revisit normalization after the first pilot reveals what we query often.

## Implementation Phases

### Phase 0: Source Control and Environments

- Create/connect GitHub repo.
- Ensure Vercel deploys from `main`.
- Fill Vercel env vars.
- Configure Supabase project and run migrations.
- Add environment validation for all required keys.

### Phase 1: Database, Auth, and Tenant Guards

- Connect Supabase Postgres.
- Run Drizzle migrations.
- Wire Clerk auth and organizations.
- Add server-side tenant helpers.
- Protect admin routes and API routes.
- Seed current mock clients into the database.

### Phase 2: Client Config Engine

- Implement `BelloryClientConfig` Zod schema.
- Add draft save endpoint/action.
- Add readiness scoring.
- Add validation by onboarding step.
- Add publish/rollback config flow.
- Add audit logs for config edits and publishes.
- Replace frontend mock config with DB-backed config.

### Phase 3: Real Admin Data

- Replace `src/data/mock.ts` usage with server data.
- Accounts page reads real clients and metrics.
- Account Detail reads/saves real config.
- New Business Setup creates and updates real draft clients.
- Issues page reads real `client_issues`.
- Reports page reads aggregated real metrics.

### Phase 4: Provider Connection Setup

- ElevenLabs provider account record.
- Twilio number records.
- Google Calendar OAuth connection.
- Provider health checks.
- Settings page shows real provider readiness.
- Account Detail Integrations tab shows real provider state.

### Phase 5: ElevenLabs Agent Sync

- Build prompt from published config.
- Build ElevenLabs agent/tool config payload.
- Create or update client voice agent.
- Store `externalAgentId` and `externalVoiceId`.
- Add pronunciation/voice settings metadata.
- Add post-call webhook URL.
- Add per-client tool secret.

### Phase 6: Agent Tool Endpoints

Replace stubs with real implementations:

- `client-context`: returns only safe live-call context from active config.
- `classify-urgency`: evaluates caller issue against urgency rules.
- `service-area`: checks city/ZIP/radius rules.
- `calendar/availability`: applies calendar + business rules.
- `calendar/hold`: creates temporary hold or owner approval record.
- `calendar/book`: creates Google Calendar event and appointment row.
- `leads/upsert`: creates/updates lead with call data.
- `owner-alert`: sends SMS/email alert and stores notification.
- `transfer-request`: approves/denies transfer and returns transfer target.

All tools must:

- verify auth
- validate input with Zod
- log request/response
- return short voice-friendly output
- create an issue on repeated failure

### Phase 7: Calendar and Dispatch

- Implement Google OAuth.
- Store encrypted refresh token.
- Query FreeBusy.
- Apply Bellory rules locally:
  - service area
  - hours
  - emergency mode
  - slot length
  - travel buffer
  - booking mode
  - owner approval mode
- Create/update/cancel appointments.
- Add calendar webhook sync.

### Phase 8: Calls, Leads, and Post-Call Processing

- Implement ElevenLabs post-call webhook.
- Store call row, transcript messages, events, recording URL, summary, outcome.
- Upsert lead.
- Link appointment if booked/held.
- Queue Inngest post-call jobs.
- Update daily metrics.
- Create issues for failed tools, low confidence, failed transfer, missing required fields.

### Phase 9: Testing and Launch QA

- Create launch QA scenarios from the Testing tab.
- Add eval scenarios:
  - normal booking
  - urgent transfer
  - quote shopper
  - after-hours caller
  - no availability
  - out-of-service-area
  - angry caller
  - tool failure fallback
- Add pass/fail criteria.
- Require passing QA before publishing live config.

### Phase 10: Reports and Client Proof

- Aggregate daily metrics.
- Add report endpoint per client.
- Add monthly report generator.
- Track:
  - calls answered
  - appointments booked
  - jobs saved
  - hours saved
  - estimated revenue
  - urgent handoffs
  - issue rate
  - missed-call prevention

### Phase 11: Billing and Plans

- Stripe customers and subscriptions.
- Setup fee and monthly plans.
- Customer portal.
- Plan limits:
  - active clients
  - phone numbers
  - minutes
  - custom voice/profile
  - integrations
  - reports

### Phase 12: Production Hardening

- Sentry.
- Rate limits.
- Webhook signature verification.
- Secret encryption/rotation.
- Data retention jobs.
- Audit log review.
- Runbooks for:
  - voice provider outage
  - phone outage
  - calendar outage
  - failed owner alerts
  - bad AI response incident

## First Backend Sprint

Goal: make the admin app save real client configs and prepare for one live ElevenLabs demo agent.

Deliverables:

1. Create/update `BelloryClientConfig` Zod schema.
2. Expand `ClientConfigSnapshot` type in `src/db/schema.ts`.
3. Add `client_issues` and `client_daily_metrics` tables.
4. Run/generate Drizzle migration.
5. Seed current mock clients into Supabase/local DB.
6. Add server queries/actions:
   - list clients
   - get client detail
   - create draft client
   - save config draft
   - validate config
   - publish config
7. Replace Account and Account Detail mock reads with server data.
8. Keep agent tool endpoints stubbed but change them to read active config where possible.
9. Add readiness scoring that matches the 12-step onboarding UI.
10. Add issue generation for missing required config.

Definition of done:

- A new business can be created from the onboarding flow.
- Each onboarding step saves to the draft config.
- Account Detail loads the saved draft config.
- Publish validates the config and creates a published version.
- Accounts page shows real setup readiness.
- Issues page shows real config issues.
- Existing `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Second Backend Sprint

Goal: connect one real demo receptionist path.

Deliverables:

1. Add ElevenLabs account/provider connection.
2. Create one demo ElevenLabs agent manually or through API.
3. Store the agent/voice IDs.
4. Build prompt from published config.
5. Sync prompt/tool config to ElevenLabs.
6. Configure one Twilio number.
7. Replace key agent tool stubs:
   - `client-context`
   - `service-area`
   - `classify-urgency`
   - `leads/upsert`
   - `owner-alert`
8. Add post-call webhook storage.
9. Run test calls and create call records.
10. Show those calls/jobs in Account Detail.

Definition of done:

- A real phone call can reach the Bellory demo agent.
- The agent can load client context from Bellory.
- The call creates a call row and lead row.
- The owner alert can be queued.
- The admin UI shows the call outcome.

## Third Backend Sprint

Goal: real scheduling and launch QA.

Deliverables:

1. Google Calendar OAuth.
2. Availability lookup.
3. Appointment hold/book.
4. Owner approval mode.
5. Launch QA scenario records.
6. Eval run storage.
7. Publish gate requires required QA scenarios to pass.

Definition of done:

- Bellory can check calendar availability.
- Bellory can hold or book appointments depending on booking mode.
- Failed calendar actions create issues.
- Launch QA is visible and enforced.

## Open Decisions

- GitHub account/org that will own the repo.
- Supabase project credentials.
- Whether first client uses Google Calendar only.
- AI disclosure and call recording language for legal review.
- Whether each client gets a separate ElevenLabs agent or a shared template with runtime variables.
- First vertical to tune deeply: garage doors, plumbing, HVAC, or another service business.
- Owner alerts: SMS only first, email only first, or both.
- Whether Bellory should start in owner approval mode for every pilot.

## Immediate Next Step

Implement Sprint 1:

1. Build `BelloryClientConfig` schema.
2. Add config save/publish server actions.
3. Add database-backed client list/detail.
4. Add issue generation for missing config.
5. Move the current frontend off mock config data without changing the polished UI.
