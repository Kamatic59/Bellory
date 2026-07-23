export type ProspectStatus = "untouched" | "working" | "demo_sent" | "pilot" | "paying" | "not_fit";

export type DialOutcome =
  | "no_answer"
  | "voicemail"
  | "gatekeeper"
  | "conversation"
  | "demo_committed"
  | "pilot_agreed"
  | "became_paying"
  | "not_fit";

export type SalesProspect = {
  id: string;
  company: string;
  phone: string | null;
  altPhones: Array<{ label: string; phone: string }>;
  area: string | null;
  tier: number;
  research: string | null;
  angle: string | null;
  status: ProspectStatus;
  nextActionAt: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
  dialCount: number;
  lastDialAt: string | null;
};

export type SalesDial = {
  id: string;
  prospectId: string;
  outcome: DialOutcome;
  caller: string | null;
  note: string | null;
  createdAt: string;
};

export type CreateProspectPayload = {
  company: string;
  phone?: string;
  area?: string;
  tier?: number;
  research?: string;
  angle?: string;
  notes?: string;
};

export type UpdateProspectPayload = Partial<{
  company: string;
  phone: string | null;
  area: string | null;
  tier: number;
  status: ProspectStatus;
  nextActionAt: string | null;
  notes: string | null;
}>;

export type LogDialPayload = {
  prospectId: string;
  outcome: DialOutcome;
  caller?: string;
  note?: string;
  nextActionAt?: string | null;
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

export async function listProspects() {
  const data = await requestJson<{ ok: true; prospects: SalesProspect[] }>("/api/sales/prospects");
  return data.prospects;
}

export async function createProspect(payload: CreateProspectPayload) {
  const data = await requestJson<{ ok: true; prospect: SalesProspect }>("/api/sales/prospects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.prospect;
}

export async function updateProspect(prospectId: string, payload: UpdateProspectPayload) {
  const data = await requestJson<{ ok: true; prospect: SalesProspect }>(`/api/sales/prospects/${prospectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.prospect;
}

export async function deleteProspect(prospectId: string) {
  await requestJson<{ ok: true }>(`/api/sales/prospects/${prospectId}`, { method: "DELETE" });
}

export async function listDials() {
  const data = await requestJson<{ ok: true; dials: SalesDial[] }>("/api/sales/dials");
  return data.dials;
}

export async function logDial(payload: LogDialPayload) {
  return requestJson<{ ok: true; dial: SalesDial; prospect: SalesProspect }>("/api/sales/dials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function importUtahProspects() {
  return requestJson<{ ok: true; inserted: number; skipped: number }>("/api/sales/import", { method: "POST" });
}
