import { apiError } from "@/lib/server/api-error";
import { getClientConfig } from "@/lib/server/clients/client-config-store";
import { buildKnowledgeBaseDocument } from "@/lib/server/config/knowledge-base-builder";

export const runtime = "nodejs";

function safeFilename(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return cleaned || "bellory-client";
}

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await context.params;
    const payload = await getClientConfig(clientId);
    if (!payload) return Response.json({ ok: false, error: "Client not found" }, { status: 404 });

    const clientName = payload.config.businessIdentity?.publicName || payload.client.name;
    const markdown = buildKnowledgeBaseDocument(payload.config, { clientName });
    const filename = `${safeFilename(clientName)}-bellory-knowledge-base.md`;

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
