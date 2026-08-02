import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server";

function hasValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : typeof value === "boolean" ? value : String(value ?? "").trim().length > 0;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authUserId, profile, supabase } = await requireRole(["founder"]);
    const service = createServiceClient() as SupabaseClient | null;
    if (!service) throw new AuthorizationError(503, "Internal registration requires server configuration.");
    const body = await request.json() as { formId?: string; answers?: Record<string, unknown> };
    if (!body.formId || !body.answers) return NextResponse.json({ error: "Registration answers are required." }, { status: 400 });
    const db = supabase as unknown as SupabaseClient;
    const { data: form } = await db
      .from("opportunity_forms")
      .select("id, opportunity_id, organisation_id, status, application_mode, opportunity_form_fields(id, field_key, field_type, label, required)")
      .eq("id", body.formId)
      .eq("opportunity_id", id)
      .eq("status", "published")
      .eq("is_active", true)
      .maybeSingle();
    if (!form || form.application_mode !== "internal_form") throw new AuthorizationError(404, "The published registration form was not found.");
    const fields = Array.isArray(form.opportunity_form_fields) ? form.opportunity_form_fields : [];
    const missing = fields.filter((field) => field.required && !hasValue(body.answers?.[field.field_key])).map((field) => field.label);
    if (missing.length) return NextResponse.json({ error: `Complete required fields: ${missing.join(", ")}.` }, { status: 422 });

    const { data: existing } = await service.from("applications").select("id").eq("founder_profile_id", profile.id).eq("opportunity_id", id).maybeSingle();
    if (existing) throw new AuthorizationError(409, "You already have a registration for this opportunity.");
    const now = new Date().toISOString();
    const { data: application, error } = await service.from("applications").insert({
      founder_id: authUserId,
      founder_profile_id: profile.id,
      organisation_id: form.organisation_id,
      opportunity_id: id,
      opportunity_form_id: form.id,
      answers_json: body.answers,
      application_copy_json: { registrationType: "internal_organiser_form" },
      status: "submitted",
      quality_status: "not_applicable",
      submitted_at: now,
      updated_at: now
    }).select("id, status, submitted_at").single();
    if (error || !application) throw new Error("Registration could not be submitted.");
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed." }, { status: 500 });
  }
}
