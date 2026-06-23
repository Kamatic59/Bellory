import { apiError } from "@/lib/server/api-error";
import { getClientConfig, saveClientConfigDraft } from "@/lib/server/clients/client-config-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const config = await getClientConfig(clientId);
    if (!config) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
    return Response.json({ ok: true, ...config });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const patch = await request.json();
    const config = await saveClientConfigDraft(clientId, patch);
    if (!config) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
    return Response.json({ ok: true, ...config });
  } catch (error) {
    return apiError(error);
  }
}
