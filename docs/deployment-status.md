# Bellory Deployment Status

Last updated: June 19, 2026

## Vercel

Status: **created and deployed**

- Vercel account/team: `kaels-projects-da869f9e`
- Project: `bellory`
- Production alias: https://bellory.vercel.app
- Deployment URL: https://bellory-21sjulxzw-kaels-projects-da869f9e.vercel.app
- Inspector URL: https://vercel.com/kaels-projects-da869f9e/bellory/Azt3k7nq7EGMVyAzTVGmFHuYoVcH
- Health endpoint: https://bellory.vercel.app/api/health

Configured Vercel env:

- `NEXT_PUBLIC_APP_URL` in Production

Still needed in Vercel:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `ENCRYPTION_KEY`
- `AGENT_TOOL_SHARED_SECRET`
- Clerk keys
- OpenAI key/project
- ElevenLabs keys/agent IDs
- Twilio keys
- Google Calendar OAuth keys
- Stripe keys
- Inngest keys
- Resend key/from email
- Sentry DSN

## Supabase

Status: **local config initialized; remote setup blocked by auth**

- Local config: `supabase/config.toml`
- Local project id: `bellory`
- Drizzle schema: `src/db/schema.ts`
- Generated migration: `drizzle/0000_huge_gateway.sql`

Blocked because:

- Supabase CLI needs `supabase login --token <token>` or `SUPABASE_ACCESS_TOKEN`.

After auth/project creation:

```bash
npx supabase link --project-ref <project-ref>
npm run db:migrate
```

## GitHub

Status: **local branch ready; remote setup blocked by auth/repo**

- Local branch: `main`
- Git user: `Kamatic59 <kaelmichaelson@gmail.com>`
- Remote: none configured

Blocked because:

- GitHub CLI is not installed.
- `GITHUB_TOKEN` is not present.
- No GitHub repo URL has been provided.

After GitHub repo creation:

```bash
git remote add origin git@github.com:<owner>/bellory.git
git push -u origin main
```

## Local Verification

Passed:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `https://bellory.vercel.app/api/health`

Known warnings:

- `npm audit` reports moderate dependency findings after adding backend packages. Do not run `npm audit fix --force` blindly; review before changing major/transitive versions.
