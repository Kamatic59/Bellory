import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clientDailyMetrics,
  clientConfigVersions,
  clientIssues,
  clients,
  organizations,
} from "@/db/schema";
import { parseClientConfigDraft, validateClientConfigForPublish } from "@/lib/server/config/config-validation";
import { createDemoClientConfig } from "@/lib/server/config/demo-config";
import { buildReceptionistPrompt } from "@/lib/server/config/prompt-builder";
import { getConfigReadiness } from "@/lib/server/config/readiness-score";

const defaultOrg = {
  name: "Bellory",
  slug: "bellory",
};

type CreateClientInput = {
  name: string;
  industry: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeDraft(base: unknown, patch: unknown): Record<string, unknown> {
  if (!isPlainObject(base)) return isPlainObject(patch) ? patch : {};
  if (!isPlainObject(patch)) return base;

  return Object.fromEntries(Array.from(new Set([...Object.keys(base), ...Object.keys(patch)])).map((key) => {
    const baseValue = base[key];
    const patchValue = patch[key];
    if (patchValue === undefined) return [key, baseValue];
    if (isPlainObject(baseValue) && isPlainObject(patchValue)) return [key, mergeDraft(baseValue, patchValue)];
    return [key, patchValue];
  }));
}

async function getOrCreateDefaultOrganization() {
  const db = getDb();
  const [existing] = await db.select().from(organizations).where(eq(organizations.slug, defaultOrg.slug)).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(organizations).values(defaultOrg).returning();
  return created;
}

async function getLatestConfigVersion(clientId: string, status?: string) {
  const db = getDb();
  const where = status
    ? and(eq(clientConfigVersions.clientId, clientId), eq(clientConfigVersions.status, status))
    : eq(clientConfigVersions.clientId, clientId);

  const [version] = await db
    .select()
    .from(clientConfigVersions)
    .where(where)
    .orderBy(desc(clientConfigVersions.version))
    .limit(1);

  return version;
}

async function getNextConfigVersion(clientId: string) {
  const db = getDb();
  const [result] = await db
    .select({ nextVersion: sql<number>`coalesce(max(${clientConfigVersions.version}), 0) + 1` })
    .from(clientConfigVersions)
    .where(eq(clientConfigVersions.clientId, clientId));

  return Number(result?.nextVersion ?? 1);
}

export async function listClientsForDefaultOrganization() {
  const db = getDb();
  const org = await getOrCreateDefaultOrganization();
  const rows = await db.select().from(clients).where(eq(clients.organizationId, org.id)).orderBy(desc(clients.createdAt));

  return Promise.all(rows.map(async (client) => {
    const configVersion = await getLatestConfigVersion(client.id);
    const readiness = getConfigReadiness(parseClientConfigDraft(configVersion?.config ?? {}));
    const [openIssueCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientIssues)
      .where(and(eq(clientIssues.clientId, client.id), eq(clientIssues.status, "open")));
    const [metrics] = await db
      .select({
        callsAnswered: sql<number>`coalesce(sum(${clientDailyMetrics.callsAnswered}), 0)::int`,
        appointmentsBooked: sql<number>`coalesce(sum(${clientDailyMetrics.appointmentsBooked}), 0)::int`,
        jobsSaved: sql<number>`coalesce(sum(${clientDailyMetrics.jobsSaved}), 0)::int`,
        estimatedRevenueCents: sql<number>`coalesce(sum(${clientDailyMetrics.estimatedRevenueCents}), 0)::int`,
        hoursSavedMinutes: sql<number>`coalesce(sum(${clientDailyMetrics.hoursSavedMinutes}), 0)::int`,
        urgentHandoffs: sql<number>`coalesce(sum(${clientDailyMetrics.urgentHandoffs}), 0)::int`,
        toolFailures: sql<number>`coalesce(sum(${clientDailyMetrics.toolFailures}), 0)::int`,
      })
      .from(clientDailyMetrics)
      .where(eq(clientDailyMetrics.clientId, client.id));

    return {
      ...client,
      configVersion: configVersion?.version ?? null,
      configStatus: configVersion?.status ?? null,
      readiness,
      openIssues: Number(openIssueCount?.count ?? 0),
      metrics: {
        callsAnswered: Number(metrics?.callsAnswered ?? 0),
        appointmentsBooked: Number(metrics?.appointmentsBooked ?? 0),
        jobsSaved: Number(metrics?.jobsSaved ?? 0),
        estimatedRevenueCents: Number(metrics?.estimatedRevenueCents ?? 0),
        hoursSavedMinutes: Number(metrics?.hoursSavedMinutes ?? 0),
        urgentHandoffs: Number(metrics?.urgentHandoffs ?? 0),
        toolFailures: Number(metrics?.toolFailures ?? 0),
      },
    };
  }));
}

export async function listOpenIssuesForDefaultOrganization() {
  const db = getDb();
  const org = await getOrCreateDefaultOrganization();

  return db
    .select({
      id: clientIssues.id,
      clientId: clientIssues.clientId,
      clientName: clients.name,
      clientIndustry: clients.industry,
      severity: clientIssues.severity,
      status: clientIssues.status,
      source: clientIssues.source,
      title: clientIssues.title,
      description: clientIssues.description,
      actionLabel: clientIssues.actionLabel,
      createdAt: clientIssues.createdAt,
      updatedAt: clientIssues.updatedAt,
    })
    .from(clientIssues)
    .leftJoin(clients, eq(clientIssues.clientId, clients.id))
    .where(and(eq(clientIssues.organizationId, org.id), eq(clientIssues.status, "open")))
    .orderBy(desc(clientIssues.createdAt));
}

export async function createClientWithDraft(input: CreateClientInput) {
  const db = getDb();
  const org = await getOrCreateDefaultOrganization();
  const initialConfig = createDemoClientConfig(input.name);
  initialConfig.businessIdentity.industry = input.industry;
  initialConfig.businessIdentity.ownerName = input.primaryContactName || "Business owner";
  initialConfig.businessIdentity.ownerPhone = input.primaryContactPhone || "+18015550100";
  initialConfig.businessIdentity.ownerEmail = input.primaryContactEmail;

  const [client] = await db.insert(clients).values({
    organizationId: org.id,
    name: input.name,
    industry: input.industry,
    status: "setup",
    primaryContactName: input.primaryContactName,
    primaryContactPhone: input.primaryContactPhone,
    primaryContactEmail: input.primaryContactEmail,
    timezone: initialConfig.businessIdentity.timezone,
  }).returning();

  const [draft] = await db.insert(clientConfigVersions).values({
    clientId: client.id,
    version: 1,
    status: "draft",
    config: initialConfig,
    promptPreview: buildReceptionistPrompt(initialConfig),
  }).returning();

  return { client, draft, readiness: getConfigReadiness(initialConfig) };
}

export async function getClientConfig(clientId: string) {
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return null;

  const draft = await getLatestConfigVersion(clientId, "draft");
  const published = await getLatestConfigVersion(clientId, "published");
  const active = draft ?? published ?? await getLatestConfigVersion(clientId);
  const config = parseClientConfigDraft(active?.config ?? {});

  return {
    client,
    configVersion: active,
    draft,
    published,
    config,
    readiness: getConfigReadiness(config),
    validation: validateClientConfigForPublish(config),
  };
}

export async function saveClientConfigDraft(clientId: string, patch: unknown) {
  const db = getDb();
  const existing = await getClientConfig(clientId);
  if (!existing) return null;

  const draft = existing.draft;
  const merged = parseClientConfigDraft(mergeDraft(existing.config, patch));
  const validation = validateClientConfigForPublish(merged);
  const promptPreview = validation.ok ? buildReceptionistPrompt(validation.config) : existing.configVersion?.promptPreview;

  if (draft) {
    const [updated] = await db.update(clientConfigVersions)
      .set({ config: merged, promptPreview, updatedAt: new Date() })
      .where(eq(clientConfigVersions.id, draft.id))
      .returning();

    return { configVersion: updated, config: merged, readiness: getConfigReadiness(merged), validation };
  }

  const [created] = await db.insert(clientConfigVersions).values({
    clientId,
    version: await getNextConfigVersion(clientId),
    status: "draft",
    config: merged,
    promptPreview,
  }).returning();

  return { configVersion: created, config: merged, readiness: getConfigReadiness(merged), validation };
}

async function createValidationIssue(clientId: string, issues: string[]) {
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return;

  await db.update(clientIssues)
    .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(clientIssues.clientId, clientId), eq(clientIssues.source, "config_validation"), eq(clientIssues.status, "open")));

  await db.insert(clientIssues).values({
    organizationId: client.organizationId,
    clientId,
    severity: "high",
    status: "open",
    source: "config_validation",
    title: "Config is not ready to publish",
    description: issues.slice(0, 8).join("; "),
    actionLabel: "Fix required config",
    metadata: { issues },
  });
}

export async function validateClientConfig(clientId: string) {
  const config = await getClientConfig(clientId);
  if (!config) return null;
  return config.validation;
}

export async function publishClientConfig(clientId: string) {
  const db = getDb();
  const config = await getClientConfig(clientId);
  if (!config) return null;

  const validation = validateClientConfigForPublish(config.config);
  if (!validation.ok) {
    await createValidationIssue(clientId, validation.issues);
    return { ok: false as const, validation };
  }

  const draft = config.draft ?? config.configVersion;
  if (!draft) return { ok: false as const, validation };

  await db.update(clientConfigVersions)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(clientConfigVersions.clientId, clientId), eq(clientConfigVersions.status, "published")));

  const [published] = await db.update(clientConfigVersions)
    .set({
      status: "published",
      config: validation.config,
      promptPreview: buildReceptionistPrompt(validation.config),
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientConfigVersions.id, draft.id))
    .returning();

  await db.update(clients).set({ status: "pilot", updatedAt: new Date() }).where(eq(clients.id, clientId));

  await db.update(clientIssues)
    .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(clientIssues.clientId, clientId), eq(clientIssues.source, "config_validation"), eq(clientIssues.status, "open")));

  return { ok: true as const, published, validation };
}
