import { headers } from "next/headers";
import type { ConsoleRole } from "./users";

export type CurrentUser = { username: string; role: ConsoleRole };

/**
 * Who is signed in, taken from the headers the proxy sets after checking the
 * password. Route handlers use this instead of trusting request bodies.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await headers();
  const username = store.get("x-bellory-user");
  const role = store.get("x-bellory-role");

  if (!username) return null;
  return { username, role: role === "admin" ? "admin" : "caller" };
}
