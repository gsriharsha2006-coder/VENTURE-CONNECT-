import type { SupabaseClient } from "@supabase/supabase-js";
import { FormBuilderManager } from "@/components/organisations/FormBuilderManager";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function FormBuilderPage() {
  const { profile, supabase } = await requireRole(["hackathon_organizer", "event_organizer"]);
  const db = supabase as unknown as SupabaseClient;
  const { data: memberships } = await db.from("organisation_members").select("organisation_id").eq("profile_id", profile.id).eq("status", "active");
  const ids = (memberships ?? []).map((item) => item.organisation_id);
  const { data: forms } = ids.length ? await db.from("opportunity_forms").select("id, title, status, opportunity:opportunities(title), opportunity_form_fields(field_key, field_type, label, help_text, required, configuration, sort_order)").in("organisation_id", ids).order("updated_at", { ascending: false }) : { data: [] };
  const initialForms = (forms ?? []).map((form) => { const opportunity = Array.isArray(form.opportunity) ? form.opportunity[0] : form.opportunity; const fields = (Array.isArray(form.opportunity_form_fields) ? form.opportunity_form_fields : []).sort((a, b) => a.sort_order - b.sort_order).map((field) => ({ fieldKey: field.field_key, label: field.label, fieldType: field.field_type, helpText: field.help_text ?? undefined, required: field.required, configuration: (field.configuration ?? {}) as Record<string, unknown> })); return { id: form.id, title: form.title, status: form.status, opportunityTitle: opportunity?.title ?? "Opportunity", fields }; });
  return <div className="space-y-6"><PageHeader eyebrow="Organiser operations" title="Form Builder" description="Build and publish applicant forms for internal event registration. These forms never invoke Idea Workspace or Application Quality Check." /><FormBuilderManager initialForms={initialForms} /></div>;
}
