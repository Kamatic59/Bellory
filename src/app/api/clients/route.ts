import { z } from "zod";
import { apiError } from "@/lib/server/api-error";
import { createClientWithDraft, listClientsForDefaultOrganization } from "@/lib/server/clients/client-config-store";

export const runtime = "nodejs";

const createClientSchema = z.object({
  name: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  primaryContactName: z.string().trim().optional(),
  primaryContactPhone: z.string().trim().optional(),
  primaryContactEmail: z.string().trim().email().optional(),
});

export async function GET() {
  try {
    const clients = await listClientsForDefaultOrganization();
    return Response.json({ ok: true, clients });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createClientSchema.parse(await request.json());
    const client = await createClientWithDraft(input);
    return Response.json({ ok: true, ...client }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: "Invalid client payload", issues: error.issues }, { status: 400 });
    }
    return apiError(error);
  }
}
