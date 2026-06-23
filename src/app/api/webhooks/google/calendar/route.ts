export const runtime = "nodejs";

export async function POST(request: Request) {
  return Response.json({
    ok: true,
    message: "Google Calendar webhook received by Bellory.",
    channelId: request.headers.get("x-goog-channel-id"),
    resourceState: request.headers.get("x-goog-resource-state"),
  });
}
