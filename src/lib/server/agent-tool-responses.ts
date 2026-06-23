import { buildAgentRuntimeContext } from "./config/agent-runtime-context";
import { createDemoClientConfig } from "./config/demo-config";

export type AgentToolPayload = Record<string, unknown>;

type AgentToolResult = {
  ok: boolean;
  message: string;
  data?: AgentToolPayload;
};

export async function readAgentToolPayload(request: Request): Promise<AgentToolPayload> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body as AgentToolPayload : {};
  } catch {
    return {};
  }
}

export function toolResult(result: AgentToolResult, init?: ResponseInit) {
  return Response.json(result, init);
}

export function getStubbedToolResult(toolName: string, payload: AgentToolPayload): AgentToolResult {
  const clientName = typeof payload.clientName === "string" ? payload.clientName : "Demo Client";
  const demoConfig = createDemoClientConfig(clientName);
  const runtimeContext = buildAgentRuntimeContext(demoConfig);

  switch (toolName) {
    case "client-context":
      return {
        ok: true,
        message: "Client context loaded from Bellory config contract.",
        data: runtimeContext,
      };
    case "classify-urgency":
      return {
        ok: true,
        message: "Urgency classified from configured client rules.",
        data: {
          urgency: "medium",
          reason: "Stubbed until caller issue is compared against configured urgent triggers.",
          urgentTriggers: runtimeContext.urgentTriggers,
        },
      };
    case "service-area":
      return {
        ok: true,
        message: "Service area checked.",
        data: {
          inServiceArea: true,
          confidence: 0.75,
          configuredAreas: runtimeContext.serviceAreas,
        },
      };
    case "calendar/availability":
      return {
        ok: true,
        message: "Availability checked.",
        data: {
          slots: [
            { startsAt: "2026-06-22T15:00:00.000Z", endsAt: "2026-06-22T16:00:00.000Z" },
            { startsAt: "2026-06-22T18:30:00.000Z", endsAt: "2026-06-22T19:30:00.000Z" },
          ],
        },
      };
    case "calendar/hold":
      return {
        ok: true,
        message: "Appointment slot held for owner approval.",
        data: {
          holdId: "stub_hold_id",
          expiresInMinutes: 15,
        },
      };
    case "calendar/book":
      return {
        ok: true,
        message: "Appointment booking stub accepted.",
        data: {
          appointmentId: "stub_appointment_id",
          status: "needs_approval",
        },
      };
    case "leads/upsert":
      return {
        ok: true,
        message: "Lead upsert stub accepted.",
        data: {
          leadId: "stub_lead_id",
          status: "new",
        },
      };
    case "owner-alert":
      return {
        ok: true,
        message: "Owner alert stub queued.",
        data: {
          notificationId: "stub_notification_id",
          channel: "sms",
        },
      };
    case "transfer-request":
      return {
        ok: true,
        message: "Transfer request acknowledged.",
        data: {
          transferAllowed: true,
          transferReason: "Stubbed until owner escalation rules are connected.",
        },
      };
    default:
      return {
        ok: false,
        message: `Unknown Bellory agent tool: ${toolName}`,
      };
  }
}
