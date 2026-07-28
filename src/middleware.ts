import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dashboardForRole, toDatabaseRole, type DatabaseRole } from "@/lib/auth/roles";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

type RouteGroup = "founder" | "investor" | "provider" | "validator" | "admin";

const founderAliases = [
  "/applications",
  "/billing",
  "/idea-workspace",
  "/messaging",
  "/notifications",
  "/opportunities",
  "/profile",
  "/services",
  "/vc-readiness",
  "/vc-readiness-report"
];

function requiredRouteGroup(pathname: string): RouteGroup | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/validator" || pathname.startsWith("/validator/")) return "validator";
  if (pathname === "/provider" || pathname.startsWith("/provider/")) return "provider";
  if (pathname === "/investor-dashboard" || pathname === "/investor" || pathname.startsWith("/investor/")) return "investor";
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "founder";
  if (founderAliases.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return "founder";
  return null;
}

function roleCanAccess(role: DatabaseRole, group: RouteGroup) {
  if (group === "founder") return role === "founder";
  if (group === "investor") return ["investor", "incubator", "hackathon_organizer", "event_organizer"].includes(role);
  if (group === "provider") return role === "service_provider";
  if (group === "validator") return role === "validator";
  return role === "admin";
}

function redirectWithCookies(destination: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(destination);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();
  if (!url || !publishableKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const requiredGroup = requiredRouteGroup(pathname);

  if (!user) {
    if (!requiredGroup) return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithCookies(loginUrl, response);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    if (!requiredGroup) return response;
    const profileErrorUrl = request.nextUrl.clone();
    profileErrorUrl.pathname = "/auth";
    profileErrorUrl.searchParams.set("error", "missing_profile");
    return redirectWithCookies(profileErrorUrl, response);
  }

  const role = toDatabaseRole(profile.role);
  if (pathname === "/auth") {
    return redirectWithCookies(new URL(dashboardForRole(role), request.url), response);
  }

  if (requiredGroup && !roleCanAccess(role, requiredGroup)) {
    return redirectWithCookies(new URL(dashboardForRole(role), request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
