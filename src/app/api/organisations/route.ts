import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

const organisationTypeForRole = {
  incubator: "incubator",
  hackathon_organizer: "hackathon_organiser"
} as const;

function slugify(value: string) {
  const base = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 48);
  return `${base || "organisation"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  try {
    const context = await requireRole(["incubator", "hackathon_organizer"]);
    const body = await request.json() as { name?: string; website?: string; location?: string; description?: string };
    const name = body.name?.trim() ?? "";
    if (name.length < 2 || name.length > 160) return NextResponse.json({ error: "Organisation name must contain 2 to 160 characters." }, { status: 400 });
    if (body.website) {
      try { const url = new URL(body.website); if (url.protocol !== "https:") throw new Error(); } catch { return NextResponse.json({ error: "Website must be a valid HTTPS URL." }, { status: 400 }); }
    }
    const db = context.supabase as unknown as SupabaseClient;
    const { data: existing } = await db.from("organisation_members").select("organisation_id").eq("profile_id", context.profile.id).eq("status", "active").limit(1);
    if (existing?.length) throw new AuthorizationError(409, "This account already belongs to an organisation.");
    const { data, error } = await db.from("organisations").insert({
      name,
      organisation_type: organisationTypeForRole[context.role as keyof typeof organisationTypeForRole],
      slug: slugify(name),
      description: body.description?.trim() || null,
      website: body.website?.trim() || null,
      location: body.location?.trim() || null,
      verification_status: "pending",
      verification_metadata: {},
      created_by_profile_id: context.profile.id
    }).select("id, name, organisation_type, verification_status").single();
    if (error || !data) throw new Error("Organisation profile could not be created.");
    return NextResponse.json({ organisation: data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organisation onboarding failed." }, { status: 500 });
  }
}
