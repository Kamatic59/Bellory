# ElevenLabs Agent Architecture

Bellory will use an Agent-first architecture. ElevenLabs handles the live phone conversation runtime; Bellory handles business setup, configuration, tools, records, and reporting.

## What ElevenLabs Agents Handle

- Real-time phone conversation loop.
- Speech recognition, turn-taking, interruption handling, LLM response generation, and text-to-speech.
- Twilio phone number connection through the native Twilio integration.
- Agent voice, language, first message, system prompt, knowledge base, and tool configuration.
- Built-in system tools such as transferring calls to a phone number.
- Post-call analysis and webhook delivery.

This keeps Bellory from needing to build our own low-latency media streaming layer for the MVP.

## What Bellory Handles

- Admin onboarding for each garage door business.
- Business configuration: services, service areas, hours, booking rules, urgent scenarios, fallback contacts, pricing language, and disclosure requirements.
- Agent prompt and tool configuration generation.
- Calendar integration and booking logic.
- Lead, call, appointment, and issue records.
- Owner alerts and post-call summaries.
- Reporting: calls answered, jobs saved, revenue influenced, hours saved, transfers, booking status, and errors.

## Recommended Runtime Flow

1. A caller dials the client phone number.
2. The Twilio number has already been imported into ElevenLabs and assigned to the client's agent.
3. ElevenLabs answers the call with the assigned Bellory agent.
4. The agent uses its prompt, voice, dynamic variables, and tools to run the conversation.
5. When the agent needs business data or must take action, it calls Bellory webhook tools.
6. Bellory tools return structured answers for availability, service area, urgency, booking, lead capture, owner alerts, and fallback contacts.
7. If a human should take over, the agent uses ElevenLabs' transfer-to-number system tool with natural caller language:
   - "I'm going to forward you to someone who can help better."
   - "Let me get you over to the right person."
8. After the call, ElevenLabs sends Bellory a post-call webhook.
9. Bellory stores the transcript, analysis, outcome, tool calls, appointment, lead, issues, and metrics.

## Native Twilio Integration Vs Register Call

Use ElevenLabs native Twilio integration first.

Why:

- It supports inbound calls on purchased Twilio numbers.
- ElevenLabs can assign the number directly to an agent.
- ElevenLabs can automatically configure the Twilio number.
- Transfer-to-number support is strongest when the number is imported through the native Twilio integration.

Only consider the register-call endpoint later if Bellory needs custom Twilio routing before the caller reaches ElevenLabs.

## Agent Per Client

For Bellory, each client should get its own ElevenLabs agent or a branch/copy of a base Bellory garage door template.

That lets us customize:

- Business name and greeting.
- Voice selection.
- Service area and hours.
- Urgency/fallback behavior.
- Transfer destinations.
- Tool auth/config.
- Knowledge base and approved language.

Bellory should store the ElevenLabs `agent_id` in `voice_agents.external_agent_id`.

## Bellory Webhook Tools

Start with fewer, high-quality tools instead of many tiny ones:

- `bellory_get_client_context`
  - Returns business identity, hours, timezone, service area rules, services, booking behavior, and fallback contacts.
- `bellory_check_service_area`
  - Checks whether the caller location is inside the client service area.
- `bellory_classify_urgency`
  - Confirms urgent scenarios such as stuck-open door, broken spring, trapped vehicle, off-track door, and after-hours emergency.
- `bellory_check_availability`
  - Returns bookable openings based on the client's calendar and business rules.
- `bellory_book_appointment`
  - Creates or holds an appointment.
- `bellory_save_lead`
  - Stores caller details, issue, urgency, and call outcome.
- `bellory_send_owner_alert`
  - Sends urgent summaries to the owner or fallback contact.

Tool descriptions must be explicit because ElevenLabs agents choose tools based on the tool name, description, parameter descriptions, and system prompt instructions.

## Dynamic Variables

Use ElevenLabs dynamic variables for runtime context that should not require a new agent:

- `client_id`
- `business_name`
- `timezone`
- `called_number`
- `caller_phone`
- `conversation_id`
- `service_area_hint`

Do not put secrets, OAuth tokens, or private admin notes into prompt text. Use secret dynamic variables or server-side tool auth for sensitive values.

## Post-Call Webhook Handling

Bellory should enable `post_call_transcription` webhooks first. Store:

- `agent_id`
- `conversation_id`
- call status
- transcript
- analysis summary
- call success result
- call duration
- Twilio metadata
- tool calls and tool results
- appointment/lead outcome
- issues or low-confidence flags

Audio webhooks can be added later if we need to archive full audio.

Webhook handlers must return HTTP 200 quickly and verify ElevenLabs webhook signatures before trusting the payload.

## Prompt Rules To Carry Forward

The agent should sound like a real receptionist.

- Do not proactively say it is AI during normal call flow.
- If asked, answer honestly and briefly.
- Ask one question at a time.
- Use natural receptionist language.
- Avoid saying "fallback", "workflow", "routing rules", or "automation" to callers.
- When handing off, say "I'll forward you to someone who can help better" or similar.
- Never invent availability, pricing, warranties, credentials, or safety advice.
- Use Bellory tools before confirming bookings, urgent transfers, or service-area decisions.

## First Backend Build Order

1. Store the ElevenLabs `agent_id` for the test agent in Bellory.
2. Replace stubbed agent-tool responses with real config-backed responses.
3. Add tool-call logging for every ElevenLabs tool request.
4. Configure the test agent in ElevenLabs with Bellory webhook tools.
5. Configure post-call webhook verification and persistence.
6. Connect Google Calendar availability and booking.
7. Add a "Publish to ElevenLabs" action that builds the prompt/tool config from the admin setup.
8. Add tests/simulations for broken spring, trapped vehicle, after-hours, out-of-area, no availability, caller asks for AI, and human transfer.

## Official References

- ElevenLabs Agents overview: https://elevenlabs.io/docs/eleven-agents/overview
- Native Twilio integration: https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration
- Webhook tools: https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools
- Dynamic variables: https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables
- Transfer to number: https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools/transfer-to-number
- Post-call webhooks: https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks
