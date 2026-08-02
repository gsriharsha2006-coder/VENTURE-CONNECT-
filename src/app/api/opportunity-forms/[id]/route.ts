import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireOrganisationMembership, requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server";

const fieldTypes = new Set(["short_text", "long_text", "email", "phone", "number", "url", "single_select", "multi_select", "checkbox", "consent_checkbox", "team_members", "file"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole(["hackathon_organizer"]);
    const service = createServiceClient() as SupabaseClient | null;
    if (!service) throw new AuthorizationError(503, "Form management requires server configuration.");
    const { data: form } = await service.from("opportunity_forms").select("id, organisation_id, opportunity_id, status").eq("id", id).maybeSingle();
    if (!form) throw new AuthorizationError(404, "Registration form not found.");
    await requireOrganisationMembership(form.organisation_id, ["owner", "admin"]);
    const body = await request.json() as { status?: "draft" | "published" | "closed"; fields?: Array<{ fieldKey: string; label: string; fieldType: string; helpText?: string; required?: boolean; configuration?: Record<string, unknown> }> };
    if (!body.status || !["draft", "published", "closed"].includes(body.status)) return NextResponse.json({ error: "Invalid form status." }, { status: 400 });
    const fields = body.fields ?? [];
    if (!fields.length || fields.some((field) => !field.label.trim() || !/^[a-z][a-z0-9_]{1,63}$/.test(field.fieldKey) || !fieldTypes.has(field.fieldType))) return NextResponse.json({ error: "Every field needs a valid label, key, and supported type." }, { status: 400 });
    if (form.status === "published") {
      if (body.status !== "closed") return NextResponse.json({ error: "Published registration forms are immutable. Close registration to stop new submissions." }, { status: 409 });
      const { error: closeError } = await service.from("opportunity_forms").update({ status: "closed", is_active: false, updated_at: new Date().toISOString() }).eq("id", id).eq("organisation_id", form.organisation_id);
      if (closeError) throw new Error("Registration could not be closed.");
      return NextResponse.json({ saved: true, status: "closed" });
    }
    let { data: section } = await service.from("opportunity_form_sections").select("id").eq("form_id", id).order("sort_order").limit(1).maybeSingle();
    if (!section) {
      const created = await service.from("opportunity_form_sections").insert({ form_id: id, title: "Registration details", sort_order: 0 }).select("id").single();
      if (created.error || !created.data) throw new Error("Form section could not be created.");
      section = created.data;
    }
    const { error: deleteError } = await service.from("opportunity_form_fields").delete().eq("form_id", id);
    if (deleteError) throw new Error("Existing form fields could not be updated.");
    const { error: insertError } = await service.from("opportunity_form_fields").insert(fields.map((field, index) => ({ form_id: id, section_id: section.id, field_key: field.fieldKey, field_type: field.fieldType, label: field.label.trim(), help_text: field.helpText?.trim() || null, required: Boolean(field.required), sort_order: index, configuration: field.configuration ?? {}, validation_rules: {} })));
    if (insertError) throw new Error("Form fields could not be saved.");
    const { error: updateError } = await service.from("opportunity_forms").update({ status: body.status, published_at: body.status === "published" ? new Date().toISOString() : null, is_active: body.status !== "closed" }).eq("id", id);
    if (updateError) throw new Error("Form status could not be saved.");
    return NextResponse.json({ saved: true, status: body.status });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form update failed." }, { status: 500 });
  }
}
