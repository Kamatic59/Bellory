# Bellory — Session Handoff

Last updated: 2026-07-06. This is the fast-start note for a fresh Claude Code session.
Read it, then `git log --oneline -25` to see everything shipped.

## What Bellory is

Admin-run AI receptionist platform for service businesses (garage door companies first).
Operators onboard a client in the admin console, which creates a per-client ElevenLabs
voice agent that answers the phone, qualifies callers, checks service area/urgency, and
books/reschedules/cancels real Google Calendar appointments. Post-call transcripts, leads,
and appointments flow back into the admin.

Repo: `C:\Users\KaelM\knockly` · GitHub `Kamatic59/Bellory` (branch `main`) · deploys to
Vercel at https://bellory.vercel.app on push. Admin at `/admin` (Basic Auth).

## Live test client

**Wasatch Garage Door Co.** — a fully fleshed-out fake company used for testing.
- Client id: `66f3bebc-d491-485d-8bf5-28868d3209a8`
- ElevenLabs agent id: `agent_5001kwmsk2zefacbc48n7h09jzh6`
- Live phone number: **+1 (385) 340-1808** (Twilio, assigned to the agent)
- Receptionist name "Sam"; current voice is Finch (`hFskf6X0TFndppvQxiEF`, a phone-agent voice)
- Google Calendar connected as kaelmichaelson@gmail.com; booking mode currently `direct` (for testing)

## What is built and working (all committed + deployed)

- **Front end**: landing page + admin fully redesigned (editorial "call-ledger" style,
  Fraunces display font, custom dropdowns). Launch audit fixes applied (contrast, 404, OG image).
- **Agent tool endpoints** (`src/lib/server/agent-tools/`): client-context, service-area,
  classify-urgency, calendar availability/hold/book, leads/upsert, owner-alert, transfer,
  and appointments lookup/reschedule/cancel. Shared runtime does auth, zod, per-call logging
  to `agent_tool_calls`, and auto-issues on repeated failure.
- **Post-call webhook** (`src/lib/server/webhooks/elevenlabs-post-call.ts`): HMAC-verified,
  idempotent, stores call + transcript + events, links tool calls, updates daily metrics.
  The webhook is BOUND in ElevenLabs convai settings (was the bug that lost early calls).
- **ElevenLabs agent sync** (`src/lib/server/elevenlabs/agent-sync.ts`): the "Sync to
  ElevenLabs" button creates/updates the agent — system prompt + platform layers (Speech
  Style, Warmth, Natural Imperfection, tool discipline, reschedule handling), voice + turbo
  TTS, per-client webhook tools (client_id baked in as constant), and auto-uploads the KB doc.
- **Google Calendar** (`src/lib/server/google/`): OAuth connect flow (AES-GCM encrypted
  refresh token), FreeBusy-aware availability, event create/update/delete kept in sync with
  bookings, reschedules, and cancels.
- **Phone numbers** (`src/lib/server/twilio/`, `.../clients/client-phone.ts`): connect an
  owned Twilio number or search/buy by area code from the Call Flow tab; auto-imports to
  ElevenLabs and assigns the agent.
- **Admin self-service**: voice picker with preview, embedded test-call widget, in-context
  issues panel, streamlined 9-step wizard.

## Credentials state (in .env.local locally + Vercel prod)

Set and working: ElevenLabs API key + webhook secret, Twilio (SID/token, account is FULL
tier now), Google OAuth client, agent tool shared secret, Supabase, encryption key.
NOT set yet: **Resend** (email alerts) and Stripe (billing) — both deferred, not blocking.

## Known-good facts / gotchas

- After any config change that should reach the live agent: **Save draft, then Sync to
  ElevenLabs**. Save alone does not update the phone line.
- ElevenLabs' conversation *simulator* may handle webhook tools differently from live calls
  (showed stalls that don't reproduce via direct API). Ground truth = a real phone call.
- Reschedule/cancel tools are verified at the data layer (book→lookup→reschedule→cancel all
  pass with calendar sync). Still want a real live phone-call confirmation.
- The stress test script is at scratchpad `stress-test-agent.mjs` (adversarial personas via
  ElevenLabs simulate-conversation). Security passed hard (no discount/prompt-leak/impersonation).

## Likely next work

1. Live phone-call test of reschedule/cancel; tighten prompt if it stalls.
2. Resend integration for owner email alerts + call summaries + daily digest.
3. Voice-library browser in admin (add community voices without the API).
4. Billing/pricing (Stripe) — see the onboarding playbook PDF; pricing not finalized.
5. Multi-tenant hardening if more operators than the single admin are added.

## Reference artifacts (in C:\Users\KaelM\Downloads)

- `Bellory-Client-Onboarding-Playbook.pdf` — operator playbook (intake questions, phone
  cases, test script, objection answers, troubleshooting).
- `Bellory-Credentials-Checklist.pdf` — provider setup steps.
