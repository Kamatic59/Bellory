import { NextRequest, NextResponse } from "next/server";

const ADMIN_ACCESS_USERNAME = process.env.ADMIN_ACCESS_USERNAME ?? "bellory";
const ADMIN_ACCESS_PASSWORD = process.env.ADMIN_ACCESS_PASSWORD ?? "bellory2026";
const AUTH_REALM = "Bellory Admin";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
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

  const validUsername = safeEqual(credentials.username, ADMIN_ACCESS_USERNAME);
  const validPassword = safeEqual(credentials.password, ADMIN_ACCESS_PASSWORD);

  if (!validUsername || !validPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/clients/:path*", "/api/issues/:path*"],
};
