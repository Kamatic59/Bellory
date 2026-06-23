export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown server error";
  const missingEnv = message.startsWith("Missing required environment variable");

  return Response.json(
    {
      ok: false,
      error: missingEnv ? "Backend environment is not configured yet." : message,
      detail: missingEnv ? message : undefined,
    },
    { status: missingEnv ? 503 : 500 },
  );
}
