export type ConsoleSession = {
  username: string;
  role: "admin" | "caller";
};

/** Who is signed in. The proxy decides this from the password, not the browser. */
export async function getSession(): Promise<ConsoleSession> {
  const response = await fetch("/api/me", { headers: { "Content-Type": "application/json" } });
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error ?? "Could not confirm who is signed in.");
  }

  return data.user as ConsoleSession;
}
