import type { BelloryClientConfigDraft } from "@/lib/server/config/client-config-schema";

export type Readiness = {
  complete: number;
  missing: string[];
  percentage: number;
  required: number;
  sectionStatus: Record<string, { complete: boolean; missing: string[] }>;
};

export type ClientMetrics = {
  callsAnswered: number;
  appointmentsBooked: number;
  jobsSaved: number;
  estimatedRevenueCents: number;
  hoursSavedMinutes: number;
  urgentHandoffs: number;
  toolFailures: number;
};

export type AppClient = {
  id: string;
  organizationId: string;
  name: string;
  industry: string;
  status: "draft" | "setup" | "pilot" | "live" | "paused" | "needs_attention";
  plan: string;
  primaryContactName: string | null;
  primaryContactPhone: string | null;
  primaryContactEmail: string | null;
  timezone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  configVersion: number | null;
  configStatus: string | null;
  readiness: Readiness;
  openIssues: number;
  metrics: ClientMetrics;
};

export type ClientIssue = {
  id: string;
  clientId: string | null;
  clientName: string | null;
  clientIndustry: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "snoozed" | "resolved";
  source: string;
  title: string;
  description: string | null;
  actionLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateClientPayload = {
  name: string;
  industry: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
};

export type ValidationResult =
  | { ok: true; config: BelloryClientConfigDraft; readiness: Readiness }
  | { ok: false; draft: BelloryClientConfigDraft; readiness: Readiness; issues: string[] };

export type ClientConfigPayload = {
  client: AppClient;
  configVersion?: { id: string; version: number; status: string; promptPreview?: string | null } | null;
  draft?: { id: string; version: number; status: string; promptPreview?: string | null } | null;
  published?: { id: string; version: number; status: string; promptPreview?: string | null } | null;
  config: BelloryClientConfigDraft;
  readiness: Readiness;
  validation: ValidationResult;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error ?? `Request failed: ${response.status}`);
  }

  return data as T;
}

export async function listClients() {
  const data = await requestJson<{ ok: true; clients: AppClient[] }>("/api/clients");
  return data.clients;
}

export async function createClient(payload: CreateClientPayload) {
  return requestJson<{ ok: true; client: AppClient; draft: unknown; readiness: Readiness }>("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getClientConfig(clientId: string) {
  return requestJson<{ ok: true } & ClientConfigPayload>(`/api/clients/${clientId}/config`);
}

export async function saveClientConfigDraft(clientId: string, config: BelloryClientConfigDraft) {
  return requestJson<{ ok: true; config: BelloryClientConfigDraft; readiness: Readiness; validation: ValidationResult }>(
    `/api/clients/${clientId}/config`,
    { method: "PATCH", body: JSON.stringify(config) },
  );
}

export async function validateClientConfig(clientId: string) {
  const data = await requestJson<{ ok: true; validation: ValidationResult }>(`/api/clients/${clientId}/config/validate`, {
    method: "POST",
  });
  return data.validation;
}

export async function publishClientConfig(clientId: string) {
  const response = await fetch(`/api/clients/${clientId}/config/publish`, { method: "POST" });
  const data = await response.json().catch(() => null);

  if (!data) throw new Error(`Publish failed: ${response.status}`);
  if (!response.ok && data.ok !== false) throw new Error(data.error ?? `Publish failed: ${response.status}`);

  return data as
    | { ok: true; published: unknown; validation: ValidationResult }
    | { ok: false; validation: ValidationResult };
}

export type ClientCall = {
  id: string;
  callerPhone: string | null;
  callerName: string | null;
  status: string;
  outcome: string | null;
  summary: string | null;
  durationSeconds: number | null;
  startedAt: string | null;
  createdAt: string;
};

export type ClientLead = {
  id: string;
  name: string | null;
  phone: string;
  issue: string | null;
  urgency: string;
  status: string;
  summary: string | null;
  createdAt: string;
};

export type ClientAppointment = {
  id: string;
  callerName: string | null;
  callerPhone: string | null;
  serviceSummary: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  createdAt: string;
};

export type ClientActivity = {
  calls: ClientCall[];
  leads: ClientLead[];
  appointments: ClientAppointment[];
};

export async function getClientActivity(clientId: string) {
  const data = await requestJson<{ ok: true } & ClientActivity>(`/api/clients/${clientId}/activity`);
  return { calls: data.calls, leads: data.leads, appointments: data.appointments };
}

export type CalendarStatus = {
  connected: boolean;
  status: string;
  email: string | null;
  updatedAt: string | null;
};

export async function getCalendarStatus(clientId: string) {
  const data = await requestJson<{ ok: true } & CalendarStatus>(`/api/clients/${clientId}/calendar/status`);
  return { connected: data.connected, status: data.status, email: data.email, updatedAt: data.updatedAt };
}

export type AgentSyncResponse = {
  ok: true;
  agentId: string;
  createdAgent: boolean;
  toolIds: Record<string, string>;
  message: string;
};

export async function syncElevenLabsAgent(clientId: string) {
  return requestJson<AgentSyncResponse>(`/api/clients/${clientId}/elevenlabs/sync`, { method: "POST" });
}

export async function listIssues() {
  const data = await requestJson<{ ok: true; issues: ClientIssue[] }>("/api/issues");
  return data.issues;
}
