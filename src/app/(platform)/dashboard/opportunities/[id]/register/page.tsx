import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { InternalRegistrationForm } from "@/components/applications/InternalRegistrationForm";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { requireRole } from "@/lib/auth/server";

export default async function InternalRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["founder"]);
  const db = supabase as unknown as SupabaseClient;
  const { data: opportunity } = await db.from("opportunities").select("id, title, organizer_name, application_method").eq("id", id).maybeSingle();
  if (!opportunity || opportunity.application_method !== "internal_registration") notFound();
  const { data: form } = await db.from("opportunity_forms").select("id, title, opportunity_form_fields(id, field_key, field_type, label, help_text, required, configuration, sort_order)").eq("opportunity_id", id).eq("application_mode", "internal_form").eq("status", "published").eq("is_active", true).maybeSingle();
  if (!form) return <StatusMessage>The organiser has not published the registration form yet.</StatusMessage>;
  const fields = (Array.isArray(form.opportunity_form_fields) ? form.opportunity_form_fields : []).sort((a, b) => a.sort_order - b.sort_order).map((field) => ({ id: field.id, fieldKey: field.field_key, fieldType: field.field_type, label: field.label, helpText: field.help_text ?? undefined, required: field.required, configuration: (field.configuration ?? {}) as Record<string, unknown> }));
  return <InternalRegistrationForm opportunityId={opportunity.id} title={opportunity.title} organiser={opportunity.organizer_name ?? "Organiser"} formId={form.id} fields={fields} />;
}
