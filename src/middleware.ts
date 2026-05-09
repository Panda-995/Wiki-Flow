import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/register"];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitMap, RATE_LIMIT_CLEANUP_INTERVAL_MS);
}

function getRateLimitKey(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";
  return `login:${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      process.env.NODE_ENV === "development"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (searchParams.has("_rsc")) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/auth")) {
    if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
      const key = getRateLimitKey(req);
      if (!checkRateLimit(key)) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: "请求过于频繁，请稍后重试" },
            { status: 429 }
          )
        );
      }
    }
    return addSecurityHeaders(NextResponse.next());
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api/");

  if (!isAdminRoute && !isApiRoute) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    if (isApiRoute) {
      return addSecurityHeaders(
        NextResponse.json({ error: "未登录" }, { status: 401 })
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (isAdminRoute && token.role !== "ADMIN") {
    return addSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
  }

  if (isApiRoute && req.method !== "GET") {
    if (!["ADMIN", "EDITOR"].includes(token.role as string)) {
      return addSecurityHeaders(
        NextResponse.json({ error: "无权限" }, { status: 403 })
      );
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js)).*)"],
};
