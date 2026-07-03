import { getClientActivity } from "@/lib/server/clients/client-activity";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await context.params;
  const activity = await getClientActivity(clientId);

  if (!activity) {
    return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  return Response.json({ ok: true, ...activity });
}
