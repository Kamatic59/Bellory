import { searchAvailableNumbers } from "@/lib/server/twilio/phone-numbers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const areaCode = new URL(request.url).searchParams.get("areaCode") ?? undefined;
  const result = await searchAvailableNumbers(areaCode);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
