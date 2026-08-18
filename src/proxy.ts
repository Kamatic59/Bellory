import { NextRequest, NextResponse } from "next/server";
import { findConsoleUser, getConsoleUsers, isPathAllowed } from "@/lib/server/auth/users";

const AUTH_REALM = "Bellory Console";

/** Headers the app reads to know who is signed in. */
export const USER_HEADER = "x-bellory-user";
export const ROLE_HEADER = "x-bellory-role";

function unauthorized() {
  return new NextResponse("Sign in to open the Bellory console.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function decodeBasicAuth(value: string) {
  const encoded = value.slice("Basic ".length).trim();
  if (!encoded) return null;

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  const credentials = decodeBasicAuth(authorization);
  if (!credentials) {
    return unauthorized();
  }

  const user = findConsoleUser(
    getConsoleUsers(process.env),
    credentials.username,
    credentials.password,
  );
  if (!user) {
    return unauthorized();
  }

  if (!isPathAllowed(user.role, request.nextUrl.pathname)) {
    return NextResponse.json(
      { ok: false, error: "Your sign-in does not have access to this part of the console." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Identity travels with the request so routes can attribute work without
  // trusting anything the browser sends.
  const headers = new Headers(request.headers);
  headers.set(USER_HEADER, user.username);
  headers.set(ROLE_HEADER, user.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/clients/:path*", "/api/issues/:path*", "/api/sales/:path*", "/api/diagnostics/:path*", "/api/me"],
};
