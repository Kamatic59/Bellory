import { apiError } from "@/lib/server/api-error";
import { publishClientConfig } from "@/lib/server/clients/client-config-store";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const result = await publishClientConfig(clientId);
    if (!result) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return apiError(error);
  }
}
