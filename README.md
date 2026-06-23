# Bellory

Frontend-only prototype for Bellory, an admin console for launching and managing custom AI receptionists for service businesses.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts

All data and interactions are mocked in the frontend. The typed mock layer in `src/data/mock.ts` is structured so it can later be replaced by Supabase, Twilio, an AI provider, Google Calendar, Stripe, and Trigger.dev or Inngest adapters.
