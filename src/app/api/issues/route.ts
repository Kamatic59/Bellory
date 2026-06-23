import { apiError } from "@/lib/server/api-error";
import { listOpenIssuesForDefaultOrganization } from "@/lib/server/clients/client-config-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const issues = await listOpenIssuesForDefaultOrganization();
    return Response.json({ ok: true, issues });
  } catch (error) {
    return apiError(error);
  }
}
