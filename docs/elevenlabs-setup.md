# ElevenLabs Setup For Bellory

Bellory uses ElevenLabs in two stages:

1. Landing-page demo audio now.
2. Live phone receptionist agents later.

## What To Create In ElevenLabs

### 1. API Key

In ElevenLabs, create an API key from the dashboard/account settings and store it as:

```env
ELEVENLABS_API_KEY=...
```

Keep this server-side only. Do not put it in any `NEXT_PUBLIC_` variable.

### 2. Bellory Receptionist Voice

Pick or create the voice that should sound like Bellory's receptionist. Copy its voice ID and store it as both values for now:

```env
ELEVENLABS_DEFAULT_VOICE_ID=...
ELEVENLABS_DEMO_VOICE_ID=...
```

### 3. Optional Caller Voice For The Website Demo

If you want the landing-page sample to sound like a real back-and-forth call, pick a second voice for the caller:

```env
ELEVENLABS_CALLER_VOICE_ID=...
```

When this value is present, `npm run audio:demo` uses ElevenLabs Text to Dialogue. Without it, the script uses normal Text to Speech with only the Bellory voice.

### 4. Later: ElevenLabs Agent ID

When we build the live phone receptionist, create an ElevenLabs agent and store:

```env
ELEVENLABS_DEFAULT_AGENT_ID=...
ELEVENLABS_WEBHOOK_SECRET=...
```

These are not needed just to regenerate the website demo audio.

## Local Setup

Add the values to `C:\Users\KaelM\knockly\.env.local`.

Then run:

```bash
npm run elevenlabs:check
npm run audio:demo
npm run build
```

`npm run audio:demo` overwrites:

```text
public/audio/bellory-garage-door-demo-v2.mp3
```

Commit and push that file so Vercel deploys the updated demo.

## Vercel Setup

Add the same server-side variables in Vercel:

```env
ELEVENLABS_API_KEY
ELEVENLABS_DEFAULT_VOICE_ID
ELEVENLABS_DEMO_VOICE_ID
ELEVENLABS_CALLER_VOICE_ID
ELEVENLABS_DEMO_MODEL_ID
ELEVENLABS_DEMO_OUTPUT_FORMAT
```

For live phone agents later, also add:

```env
ELEVENLABS_DEFAULT_AGENT_ID
ELEVENLABS_WEBHOOK_SECRET
```

## Recommended Defaults

```env
ELEVENLABS_DEMO_MODEL_ID=eleven_v3
ELEVENLABS_DEMO_OUTPUT_FORMAT=mp3_44100_128
```

For the final live phone system, we may use lower-latency agent models/settings than the static landing-page demo.
