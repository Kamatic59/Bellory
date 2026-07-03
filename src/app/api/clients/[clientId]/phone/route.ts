import { connectClientPhoneNumber, getClientPhoneState } from "@/lib/server/clients/client-phone";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await context.params;
  const state = await getClientPhoneState(clientId);
  if (!state) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });
  return Response.json({ ok: true, ...state });
}

export async function POST(request: Request, context: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await context.params;
  const body = await request.json().catch(() => ({})) as { phoneNumber?: string; purchase?: boolean };

  if (!body.phoneNumber) {
    return Response.json({ ok: false, error: "phoneNumber is required" }, { status: 400 });
  }

  try {
    const result = await connectClientPhoneNumber(clientId, body.phoneNumber, { purchase: body.purchase === true });
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("phone connect failed", error);
    return Response.json({ ok: false, error: "Connecting the number failed" }, { status: 500 });
  }
}
