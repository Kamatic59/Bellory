import { z } from "zod";
import {
  BelloryClientConfig,
  BelloryClientConfigDraft,
  belloryClientConfigDraftSchema,
  belloryClientConfigSchema,
} from "./client-config-schema";
import { getConfigReadiness } from "./readiness-score";

export type ConfigValidationResult =
  | { ok: true; config: BelloryClientConfig; readiness: ReturnType<typeof getConfigReadiness> }
  | { ok: false; draft: BelloryClientConfigDraft; readiness: ReturnType<typeof getConfigReadiness>; issues: string[] };

function formatZodIssue(issue: z.core.$ZodIssue) {
  const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}

export function parseClientConfigDraft(input: unknown): BelloryClientConfigDraft {
  return belloryClientConfigDraftSchema.parse(input ?? {});
}

export function validateClientConfigForPublish(input: unknown): ConfigValidationResult {
  const draft = parseClientConfigDraft(input);
  const readiness = getConfigReadiness(draft);
  const result = belloryClientConfigSchema.safeParse(draft);

  if (!result.success) {
    return {
      ok: false,
      draft,
      readiness,
      issues: result.error.issues.map(formatZodIssue),
    };
  }

  return {
    ok: true,
    config: result.data,
    readiness: getConfigReadiness(result.data),
  };
}
