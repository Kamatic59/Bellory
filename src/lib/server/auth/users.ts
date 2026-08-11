/**
 * Console sign-ins.
 *
 * Everyone who works the phones gets their own username and password so dials
 * are attributed automatically and nobody shares one master login. Accounts are
 * configured with the BELLORY_USERS env var, one entry per person:
 *
 *   BELLORY_USERS="kael:somepassword:admin,mike:otherpassword:caller"
 *
 * Entries are separated by commas or newlines. Each entry is
 * `username:password:role`. Passwords may contain colons (everything between
 * the first and last colon is the password) but not commas or newlines.
 * Passwords are never trimmed — a trailing space in a password is significant.
 *
 * Roles:
 *   admin  — the whole console: accounts, setup, issues, reports, settings.
 *   caller — the Sales page only. No client records, no configuration.
 *
 * ADMIN_ACCESS_USERNAME / ADMIN_ACCESS_PASSWORD still work on their own and
 * always map to an admin, so the original single login keeps working.
 */

export type ConsoleRole = "admin" | "caller";

export type ConsoleUser = {
  username: string;
  password: string;
  role: ConsoleRole;
};

function parseEntry(raw: string): ConsoleUser | null {
  const entry = raw.trim();
  if (!entry) return null;

  const parts = entry.split(":");
  if (parts.length < 2) return null;

  const username = parts[0].trim();
  if (!username) return null;

  // Least privilege: an entry without an explicit role is a caller.
  const tail = parts[parts.length - 1].trim().toLowerCase();
  const hasRole = parts.length >= 3 && (tail === "admin" || tail === "caller");
  const role: ConsoleRole = hasRole && tail === "admin" ? "admin" : "caller";

  // Passwords are used verbatim: never trimmed, colons allowed.
  const password = hasRole ? parts.slice(1, -1).join(":") : parts.slice(1).join(":");
  if (!password) return null;

  return { username, password, role };
}

export function getConsoleUsers(env: Record<string, string | undefined>): ConsoleUser[] {
  const users: ConsoleUser[] = [];

  for (const raw of (env.BELLORY_USERS ?? "").split(/[,\n]/)) {
    const user = parseEntry(raw);
    if (user) users.push(user);
  }

  // The original single admin login, kept so existing bookmarks keep working.
  // In production the password must be set explicitly — the development
  // default must never be a working key to a live console.
  const isProduction = env.NODE_ENV === "production";
  const legacyPassword = env.ADMIN_ACCESS_PASSWORD ?? (isProduction ? "" : "bellory2026");
  const legacyUsername = (env.ADMIN_ACCESS_USERNAME ?? "bellory").trim();
  if (legacyUsername && legacyPassword && !users.some((user) => user.username === legacyUsername)) {
    users.push({ username: legacyUsername, password: legacyPassword, role: "admin" });
  }

  return users;
}

/** Constant-time-ish comparison so a wrong password leaks no timing signal. */
export function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export function findConsoleUser(
  users: ConsoleUser[],
  username: string,
  password: string,
): ConsoleUser | null {
  let match: ConsoleUser | null = null;
  // Check every account so the work done does not depend on which one matched.
  for (const user of users) {
    if (safeEqual(user.username, username) && safeEqual(user.password, password)) {
      match = user;
    }
  }
  return match;
}

/**
 * What each role may reach. Callers get the console shell and the sales API and
 * nothing else — client records hold customer names, addresses and call
 * transcripts, so they stay with admins.
 */
export function isPathAllowed(role: ConsoleRole, pathname: string): boolean {
  if (role === "admin") return true;

  return (
    pathname === "/admin"
    || pathname.startsWith("/admin/")
    || pathname.startsWith("/api/sales")
    || pathname.startsWith("/api/me")
  );
}
