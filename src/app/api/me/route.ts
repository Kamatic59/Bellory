import { getCurrentUser } from "@/lib/server/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  return Response.json({ ok: true, user }, { headers: { "Cache-Control": "no-store" } });
}
