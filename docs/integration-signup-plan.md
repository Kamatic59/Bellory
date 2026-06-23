# Bellory Integration and Signup Plan

Last updated: June 22, 2026

## Deployment and Access Decision

Bellory does **not** need a custom domain for the private admin console right now.

Use:

- Admin URL: `https://bellory.vercel.app`
- App authentication: Clerk
- Optional extra lock: Vercel password/deployment protection

Important distinction:

- A custom domain is not required for a few internal admins to use the console.
- A custom domain may become useful later for polished OAuth consent screens, email sending reputation, client-facing reports, and brand trust.

## Minimum Stack to Put the Pieces Together

### 1. Vercel

Status: already created.

Purpose:

- Host the admin app.
- Host API routes and webhooks.
- Provide the public HTTPS URL for Clerk, ElevenLabs, Stripe, Google, and Inngest callbacks.

You need to do:

- Keep using the existing Vercel project: `bellory`.
- Add environment variables as we create accounts.
- Decide whether to enable Vercel password protection as a second layer.

No custom domain required.

### 2. Clerk

Purpose:

- Stop random people from opening the admin app.
- Admin login.
- Invite-only access.
- Roles later: owner, admin, operator, viewer.

Recommended setup:

- Create Clerk app named `Bellory`.
- Enable email/password or email magic-link auth.
- Disable public/self-serve signups if available on your plan.
- Add only approved admin emails.
- Use Clerk Organizations if you want workspace/team roles.

Required env:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
```

My recommendation:

- Use Clerk as the real security layer.
- Add server-side route protection so every admin page requires an authenticated Clerk user.
- Use an internal allowlist in our database/code as a fallback if Clerk allowlist requires a paid plan.

### 3. Supabase

Purpose:

- Postgres database.
- Store businesses, configurations, calls, leads, appointments, issues, reports, provider connections, and audit logs.

You need to do:

- Create Supabase project: `bellory-prod`.
- Copy two connection strings:
  - pooled/serverless URL for `DATABASE_URL`
  - direct URL for `DIRECT_DATABASE_URL`
- Add them to Vercel and local `.env.local`.

Required env:

```bash
DATABASE_URL=
DIRECT_DATABASE_URL=
ENCRYPTION_KEY=
```

Notes:

- `DATABASE_URL` should use the Supabase transaction pooler for Vercel/serverless.
- `DIRECT_DATABASE_URL` is for Drizzle migrations.
- `ENCRYPTION_KEY` is needed before storing OAuth tokens or provider secrets.

### 4. GitHub

Purpose:

- Source control.
- Vercel production deploys from `main`.
- Rollbacks and safe backend development.

You need to do:

- Create a private repo named `bellory`.
- Tell me the repo URL or add it as the remote.

Local commands once repo exists:

```bash
git branch -M main
git remote add origin git@github.com:<owner>/bellory.git
git push -u origin main
```

### 5. ElevenLabs

Purpose:

- Human-sounding AI receptionist voice.
- Conversational AI phone agent.
- Post-call analysis/webhooks.
- Tools/webhook calls into Bellory backend.

You need to do:

- Create an ElevenLabs account/workspace.
- Choose a plan that supports Conversational AI agents and phone usage.
- Create one sandbox Bellory agent.
- Pick a default voice for testing.
- Later connect Twilio number through ElevenLabs.

Required env:

```bash
ELEVENLABS_API_KEY=
ELEVENLABS_WEBHOOK_SECRET=
ELEVENLABS_DEFAULT_AGENT_ID=
ELEVENLABS_DEFAULT_VOICE_ID=
```

What I will wire:

- Agent config/prompt generation from Bellory client config.
- Tool endpoints.
- Post-call webhook ingestion.
- Voice QA and launch test tracking.

### 6. Twilio

Purpose:

- Phone numbers.
- Phone carrier layer.
- New Bellory numbers or forwarded/ported client numbers.

You need to do:

- Create Twilio account.
- Buy one test phone number.
- Add billing/calling credits.
- Connect that number to ElevenLabs native Twilio integration.

Required env:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=
TWILIO_WEBHOOK_SECRET=
```

MVP phone strategy:

- Start with one Bellory-owned test number.
- For clients, use forwarding first.
- Port numbers later only after pilots work.

### 7. Google Cloud / Google Calendar API

Purpose:

- Let Bellory check availability.
- Hold/book appointments.
- Sync appointment changes.

You need to do:

- Create Google Cloud project named `Bellory`.
- Enable Google Calendar API.
- Configure OAuth consent screen.
- Create OAuth web client.
- Add redirect URI using the Vercel app URL.

Required env:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_WEBHOOK_TOKEN=
```

No custom domain note:

- For internal testing, the Vercel URL can work as the redirect URI.
- For broader external calendar connections, Google OAuth branding/verification may eventually push us toward a custom domain and privacy policy URL.

### 8. OpenAI

Purpose:

- Back-office reasoning.
- Config audits.
- Call summaries/report polishing.
- Optional custom LLM path for ElevenLabs if needed.

You need to do:

- Create/Open OpenAI Platform account.
- Add billing.
- Create API key.

Required env:

```bash
OPENAI_API_KEY=
OPENAI_PROJECT_ID=
```

MVP use:

- Not required for the first ElevenLabs voice call if ElevenLabs handles the agent model.
- Useful quickly for admin-side summaries, config validation, and QA/evals.

### 9. Inngest

Purpose:

- Background jobs.
- Post-call processing.
- Retries.
- Monthly reports.
- Scheduled tasks.

You need to do:

- Create Inngest account.
- Connect it to Vercel or use the app’s `/api/inngest` route once implemented.

Required env:

```bash
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### 10. Resend

Purpose:

- Owner email alerts.
- Admin alerts.
- Monthly report emails.

You need to do:

- Create Resend account.
- For production sending, verify a sending domain later.
- For early internal testing, use a limited/test sender if available.

Required env:

```bash
RESEND_API_KEY=
OWNER_ALERT_FROM_EMAIL=
```

No custom domain note:

- Email deliverability is where skipping a domain hurts most.
- We can start with SMS/internal testing and add email/domain later.

### 11. Stripe

Purpose:

- Setup fees.
- Monthly subscriptions.
- Invoices.
- Customer portal.

You need to do:

- Create Stripe account when ready to charge.
- Create Starter/Pro/Premium prices.
- Configure webhook endpoint.

Required env:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

MVP note:

- Not required before first working AI receptionist pilot.
- Required before charging real clients.

### 12. Sentry

Purpose:

- Production error monitoring.
- API/webhook failure tracking.

You need to do:

- Create Sentry account/project.
- Copy DSN.

Required env:

```bash
SENTRY_DSN=
```

MVP note:

- Strongly recommended before real calls.
- Can wait until after config/database foundation.

## Optional Later Integrations

### CRM / Job System

Examples:

- Jobber
- Housecall Pro
- ServiceTitan
- GoHighLevel

Purpose:

- Push booked jobs/leads into the client’s actual operating system.

When to add:

- After the first pilot unless the first client requires it.

### SMS Provider Choice

Options:

- Twilio SMS
- Resend email only first
- Later: customer-specific messaging integrations

Recommendation:

- Use Twilio SMS for owner alerts because Twilio is already required for phone.

### Microsoft Calendar

Purpose:

- Outlook/Microsoft 365 calendar support.

When to add:

- Only when a real first client needs Outlook.

## What You Need To Sign Up For First

Priority order:

1. GitHub private repo.
2. Supabase project.
3. Clerk app.
4. ElevenLabs account.
5. Twilio account + one phone number.
6. Google Cloud project with Calendar API.
7. OpenAI Platform account.
8. Inngest account.
9. Resend account.
10. Sentry account.
11. Stripe account when ready to charge.

## What To Send Me After Signup

Do not paste secrets directly into chat if you can avoid it.

Best path:

- Put keys in `C:\Users\KaelM\knockly\.env.local`.
- Add production keys to Vercel environment variables.
- Tell me when they are added.

Needed non-secret info you can safely tell me:

- GitHub repo URL.
- Supabase project ref.
- Clerk app name.
- Vercel project URL.
- ElevenLabs agent name/ID, if created manually.
- Twilio test phone number.
- Google OAuth redirect URI you configured.

## Recommended Security Setup Without a Domain

Use three layers:

1. **Clerk auth required for the app.**
2. **Invite-only/admin-email access.**
3. **Server-side authorization checks on every API route.**

Optional fourth layer:

- Vercel password/deployment protection for the production Vercel URL.

This means that even if someone has `https://bellory.vercel.app`, they cannot use the admin console unless they are authenticated and authorized.

## First Build After Accounts Are Ready

Once Supabase and Clerk are ready, build:

1. Clerk login and protected admin routes.
2. Database connection.
3. Real clients table reads/writes.
4. Draft client config save/publish.
5. Real setup readiness scoring.
6. Real issues from missing config.

Once ElevenLabs/Twilio are ready, build:

1. Agent sync.
2. Tool endpoint auth.
3. `client-context`, `service-area`, `classify-urgency`.
4. Post-call webhook storage.
5. First real test phone call.
