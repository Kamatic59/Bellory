import { apiError } from "@/lib/server/api-error";
import { validateClientConfig } from "@/lib/server/clients/client-config-store";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const validation = await validateClientConfig(clientId);
    if (!validation) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
    return Response.json({ ok: true, validation });
  } catch (error) {
    return apiError(error);
  }
}
