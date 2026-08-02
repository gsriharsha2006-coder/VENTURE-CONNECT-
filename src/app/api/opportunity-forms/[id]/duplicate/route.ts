import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireOrganisationMembership, requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile } = await requireRole(["hackathon_organizer", "event_organizer", "admin"]);
    const service = createServiceClient() as SupabaseClient | null;
    if (!service) throw new AuthorizationError(503, "Form duplication requires server configuration.");
    const { data: source } = await service.from("opportunity_forms").select("*, opportunity_form_sections(*), opportunity_form_fields(*)").eq("id", id).maybeSingle();
    if (!source) throw new AuthorizationError(404, "Registration form not found.");
    await requireOrganisationMembership(source.organisation_id, ["owner", "admin"]);
    const { data: form, error } = await service.from("opportunity_forms").insert({ opportunity_id: source.opportunity_id, organisation_id: source.organisation_id, created_by_profile_id: profile.id, title: `${source.title} copy`, description: source.description, application_mode: "internal_form", status: "draft", is_active: false }).select("id").single();
    if (error || !form) throw new Error("Form copy could not be created.");
    const sourceSections = (Array.isArray(source.opportunity_form_sections) ? source.opportunity_form_sections : []) as Array<{ id: string; title: string; description: string | null; sort_order: number }>;
    const sourceFields = (Array.isArray(source.opportunity_form_fields) ? source.opportunity_form_fields : []) as Array<{ section_id: string | null; field_key: string; field_type: string; label: string; help_text: string | null; required: boolean; sort_order: number; configuration: unknown; validation_rules: unknown }>;
    const sectionMap = new Map<string, string>();
    for (const section of sourceSections.sort((a, b) => a.sort_order - b.sort_order)) {
      const created = await service.from("opportunity_form_sections").insert({ form_id: form.id, title: section.title, description: section.description, sort_order: section.sort_order }).select("id").single();
      if (created.error || !created.data) throw new Error("Form section copy failed.");
      sectionMap.set(section.id, created.data.id);
    }
    if (sourceFields.length) {
      const { error: fieldError } = await service.from("opportunity_form_fields").insert(sourceFields.map((field) => ({ form_id: form.id, section_id: field.section_id ? sectionMap.get(field.section_id) ?? null : null, field_key: field.field_key, field_type: field.field_type, label: field.label, help_text: field.help_text, required: field.required, sort_order: field.sort_order, configuration: field.configuration, validation_rules: field.validation_rules })));
      if (fieldError) throw new Error("Form field copy failed.");
    }
    return NextResponse.json({ formId: form.id }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Form duplication failed." }, { status: 500 });
  }
}
