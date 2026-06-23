# Bellory Service Setup Checklist

Last updated: June 19, 2026

This checklist is the account and purchase list required to turn the Bellory prototype into a working product.

## What I Can Prepare Locally

Already prepared in this repo:

- `.env.example` with all expected secrets.
- `npm run setup:check` to report missing environment variables.
- Drizzle database schema in `src/db/schema.ts`.
- Initial generated migration in `drizzle/0000_huge_gateway.sql`.
- Vercel project config in `vercel.json`.
- ElevenLabs webhook tool route skeleton:
  - `POST /api/agent-tools/client-context`
  - `POST /api/agent-tools/classify-urgency`
  - `POST /api/agent-tools/service-area`
  - `POST /api/agent-tools/calendar/availability`
  - `POST /api/agent-tools/calendar/hold`
  - `POST /api/agent-tools/calendar/book`
  - `POST /api/agent-tools/leads/upsert`
  - `POST /api/agent-tools/owner-alert`
  - `POST /api/agent-tools/transfer-request`
  - `POST /api/webhooks/elevenlabs/post-call`

## Required Accounts

### 1. GitHub

Purpose:

- Source control.
- Vercel deployments from Git.
- Pull requests and version history.

Action:

- Create a private GitHub repo named `bellory`.
- Choose owner: your personal GitHub account or a business org.
- Add this local repo as the remote.

Needed from you:

- GitHub account/org name.
- SSH key configured or GitHub personal access token.

Local commands after the repo exists:

```bash
git branch -M main
git remote add origin git@github.com:<owner>/bellory.git
git push -u origin main
```

### 2. Vercel

Purpose:

- Host the Bellory admin console.
- Host API route handlers for webhook tools.
- Preview deployments for every GitHub branch/PR.

Action:

- Create or use a Vercel account.
- Import the `bellory` GitHub repo.
- Set production branch to `main`.
- Add environment variables from `.env.example`.

Needed from you:

- Vercel account/team.
- Permission to import the GitHub repo.
- Later: domain configuration for `app.bellory.ai`.

Official docs:

- https://vercel.com/docs/git
- https://vercel.com/docs/cli
- https://vercel.com/docs/environment-variables

### 3. Supabase

Purpose:

- Production Postgres database.
- Storage later for call recordings/export files if needed.
- Realtime later if the admin console needs live updates.

Action:

- Create a Supabase project named `bellory-prod`.
- Region: choose closest to expected clients. For Utah/US customers, start with a US region.
- Copy the pooled and direct Postgres connection strings.
- Put them into Vercel and local `.env.local`:
  - `DATABASE_URL`
  - `DIRECT_DATABASE_URL`

Migration command once credentials are configured:

```bash
npm run db:migrate
```

Needed from you:

- Supabase account.
- Project password.
- Billing plan decision before production data.

Official docs:

- https://supabase.com/docs/guides/local-development/overview
- https://supabase.com/docs/guides/deployment/database-migrations

### 4. Clerk

Purpose:

- Bellory admin login.
- Organizations/workspaces.
- Team roles and invites.

Action:

- Create a Clerk app named `Bellory`.
- Enable Organizations.
- Configure allowed redirect URLs:
  - `http://localhost:3000`
  - Vercel preview domains
  - production domain later
- Add keys to Vercel and `.env.local`.

Needed environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

Official docs:

- https://clerk.com/docs/nextjs/getting-started/quickstart
- https://clerk.com/docs/nextjs/guides/organizations/getting-started

### 5. ElevenLabs

Purpose:

- Human-sounding AI receptionist voice.
- Phone agent runtime.
- Voice selection and realism bake-off.
- Post-call analysis webhooks.

Action:

- Create an ElevenLabs account/workspace.
- Choose a paid plan that supports Conversational AI/agents and enough phone minutes for testing.
- Create one Bellory sandbox agent.
- Pick 3-5 candidate voices for testing.
- Configure webhook tools after Vercel deployment is live.
- Configure post-call webhook:
  - `https://<your-vercel-domain>/api/webhooks/elevenlabs/post-call`

Needed environment variables:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `ELEVENLABS_DEFAULT_AGENT_ID`
- `ELEVENLABS_DEFAULT_VOICE_ID`

Official docs:

- https://elevenlabs.io/docs/eleven-agents/overview
- https://elevenlabs.io/docs/eleven-agents/customization/tools
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration
- https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks

### 6. Twilio

Purpose:

- Phone numbers.
- Carrier/telephony infrastructure.
- Number ownership for clients.

Action:

- Create a Twilio account.
- Buy one test phone number for Bellory.
- Add billing.
- Complete any required business/brand verification if prompted.
- Connect the Twilio number through ElevenLabs' native Twilio integration.

Needed environment variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_WEBHOOK_SECRET`

What to buy:

- At least one local US phone number for testing.
- Later, one phone number per client or ported client numbers.

Official docs:

- https://www.twilio.com/docs/phone-numbers
- https://www.twilio.com/docs/iam/api-keys
- https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration

### 7. Google Cloud / Google Calendar API

Purpose:

- Connect client calendars.
- Query availability.
- Create and update booked appointments.

Action:

- Create a Google Cloud project named `Bellory`.
- Enable Google Calendar API.
- Configure OAuth consent screen.
- Create OAuth client for web app.
- Add redirect URI once Vercel app URL exists.

Needed environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_WEBHOOK_TOKEN`

Official docs:

- https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query
- https://developers.google.com/workspace/calendar/api/guides/push

### 8. Stripe

Purpose:

- Setup fees.
- Monthly subscriptions.
- Customer portal.
- Billing events.

Action:

- Create Stripe account.
- Add business/bank information.
- Create products/prices for Starter, Pro, Premium, setup fees, and add-on minutes.
- Configure webhook endpoint:
  - `https://<your-vercel-domain>/api/webhooks/stripe`

Needed environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Official docs:

- https://docs.stripe.com/customer-management
- https://docs.stripe.com/webhooks

### 9. OpenAI

Purpose:

- Back-office reasoning, summaries, configuration audits, evals, and optionally the live-call LLM through ElevenLabs custom LLM integration.

Action:

- Create/Open an OpenAI Platform account.
- Add billing.
- Create an API key.
- Decide whether ElevenLabs uses its own model credentials or Bellory's OpenAI key/custom endpoint.

Needed environment variables:

- `OPENAI_API_KEY`
- `OPENAI_PROJECT_ID`

Official docs:

- https://developers.openai.com/api/docs/guides/reasoning

### 10. Inngest

Purpose:

- Background jobs.
- Post-call processing.
- Retry workflows.
- Monthly reports.

Action:

- Create an Inngest account.
- Connect Vercel project after deployment.
- Add keys to env.

Needed environment variables:

- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

Official docs:

- https://www.inngest.com/docs/deploy/vercel

### 11. Resend

Purpose:

- Owner email alerts.
- Monthly reports.
- Internal notifications.

Action:

- Create Resend account.
- Verify sending domain.
- Add API key.

Needed environment variables:

- `RESEND_API_KEY`
- `OWNER_ALERT_FROM_EMAIL`

Official docs:

- https://resend.com/docs

### 12. Sentry

Purpose:

- Production error monitoring.
- Webhook and API route failure visibility.

Action:

- Create Sentry account/project.
- Add DSN.

Needed environment variable:

- `SENTRY_DSN`

Official docs:

- https://docs.sentry.io/platforms/javascript/guides/nextjs/

## Purchases / Billing Required Before Real Calls

Minimum paid setup for live phone testing:

- Vercel account/team with project deployment.
- Supabase project with production database.
- ElevenLabs paid plan with Conversational AI usage.
- Twilio account with at least one phone number and calling credits.
- OpenAI billing enabled.
- Google Cloud OAuth project. Calendar API itself may not require paid usage at MVP scale, but the project must be configured.

Before selling to clients:

- Domain purchase/configuration: ideally `bellory.ai` and `app.bellory.ai`.
- Stripe account fully activated.
- Business email sending domain verified in Resend.
- Legal review for AI disclosure, call recording, TCPA/outbound calls, privacy policy, and terms.
- Business phone-number strategy: buy new numbers, port existing client numbers, or forward client numbers.

## Current Blockers For Me To Complete Online Setup

I can prepare and run local code, but I cannot create paid cloud resources without authenticated accounts and billing access.

To let me finish remote setup, provide one of these paths:

1. You log into GitHub, Vercel, Supabase, Clerk, ElevenLabs, Twilio, Stripe, Google Cloud, Inngest, and Resend in Chrome and tell me to continue.
2. You create the accounts/projects and paste the non-sensitive project identifiers plus API keys into `.env.local`.
3. You install/authenticate CLIs locally:
   - GitHub CLI: `gh auth login`
   - Vercel CLI: `npx vercel login`
   - Supabase CLI: `npx supabase login`

Do not paste secret keys into chat unless you are comfortable with that exposure. Prefer putting them in `.env.local` or directly into Vercel/Supabase dashboards.
