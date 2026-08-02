import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { opportunities } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import {
  applicationMethodNeedsExternalUrl,
  defaultApplicationMethodForType,
  validateExternalRegistrationUrl
} from "@/lib/opportunities/application-methods";
import type { ApplicationMethod, OpportunityType } from "@/lib/types";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { isPilotOpportunityType } from "@/lib/pilot/config";

export async function GET(request: Request) {
  const demoEnabled = isDemoDataEnabled();
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const location = searchParams.get("location");
  const type = searchParams.get("type");

  const filtered = (demoEnabled ? opportunities : []).filter((opportunity) => {
    const matchesDomain = !domain || domain === "All" || opportunity.domain === domain;
    const matchesLocation = !location || location === "All" || opportunity.location === location;
    const matchesType = !type || type === "All" || opportunity.type === type;
    const pilotType = opportunity.opportunity_type === "Incubator program" || opportunity.opportunity_type === "Hackathon";
    return pilotType && matchesDomain && matchesLocation && matchesType;
  });

  return NextResponse.json({
    data: filtered,
    meta: { source: demoEnabled ? "explicit-demo" : "database-required" }
  });
}

export async function POST(request: Request) {
  try {
    const { authUserId, profile, role, supabase } = await requireRole(["incubator", "hackathon_organizer"]);
    const body = await request.json() as Record<string, unknown>;
    const opportunityType = String(body.opportunity_type ?? body.type ?? "Other") as OpportunityType;
    if (!isPilotOpportunityType(opportunityType)) return NextResponse.json({ error: "The pilot supports only incubation programs and hackathons." }, { status: 400 });
    if ((role === "incubator" && opportunityType !== "Incubator program") || (role === "hackathon_organizer" && opportunityType !== "Hackathon")) {
      throw new AuthorizationError(403, "This organisation role cannot publish that opportunity type.");
    }
    const organiserRole = role === "hackathon_organizer";
    const applicationMethod = String(body.application_method ?? defaultApplicationMethodForType(opportunityType)) as ApplicationMethod;
    if (organiserRole && !["internal_registration", "external_registration"].includes(applicationMethod)) {
      return NextResponse.json({ error: "Events must use an internal organiser form or an external official registration." }, { status: 400 });
    }
    if (!organiserRole && applicationMethod !== "idea_workspace_application") {
      return NextResponse.json({ error: "Incubation programs must use Apply with Idea." }, { status: 400 });
    }
    if (!String(body.title ?? "").trim() || !String(body.deadline ?? "").trim() || !String(body.guidelines ?? "").trim()) {
      return NextResponse.json({ error: "Title, description, and deadline are required." }, { status: 400 });
    }
    if (applicationMethodNeedsExternalUrl(applicationMethod)) {
      const destination = validateExternalRegistrationUrl(String(body.external_link ?? ""));
      if (!destination.valid) return NextResponse.json({ error: destination.error }, { status: 400 });
    }
    const db = supabase as unknown as SupabaseClient;
    const { data: membership } = await db.from("organisation_members").select("organisation_id, membership_role, organisation:organisations(name)").eq("profile_id", profile.id).eq("status", "active").in("membership_role", ["owner", "admin"]).limit(1).maybeSingle();
    if (!membership) throw new AuthorizationError(403, "Organisation owner or administrator access is required.");
    const organisation = Array.isArray(membership.organisation) ? membership.organisation[0] : membership.organisation;
    const { data: opportunity, error } = await db.from("opportunities").insert({
      created_by: authUserId,
      created_by_profile_id: profile.id,
      creator_role: role,
      organisation_id: membership.organisation_id,
      title: String(body.title).trim(),
      organizer_name: String(body.organizer_name ?? organisation?.name ?? "Organisation").trim(),
      opportunity_type: opportunityType,
      category: String(body.category ?? opportunityType),
      guidelines: String(body.guidelines).trim(),
      eligibility: String(body.eligibility ?? "See programme eligibility."),
      deadline: String(body.deadline),
      mode: String(body.mode ?? "Remote"),
      location: String(body.location ?? "Remote"),
      venue: String(body.venue ?? "") || null,
      event_start_date: String(body.event_start_date ?? "") || null,
      event_end_date: String(body.event_end_date ?? "") || null,
      team_size: String(body.team_size ?? "") || null,
      prize_or_funding: String(body.prize_or_funding ?? "Details from organiser"),
      application_method: applicationMethod,
      registration_method: applicationMethod === "internal_registration" ? "internal_form" : applicationMethod === "external_registration" ? "external_application" : "workspace_application",
      external_link: applicationMethod === "external_registration" ? String(body.external_link) : null,
      official_website: String(body.official_website ?? "") || null,
      contact_email: String(body.contact_email ?? "") || null,
      eligibility_rules: body.eligibility_rules ?? {},
      required_application_fields: Array.isArray(body.required_application_fields) ? body.required_application_fields : [],
      status: body.status === "draft" ? "draft" : "published",
      verified: false,
      trending: false
    }).select("id, title, application_method").single();
    if (error || !opportunity) throw new Error("Opportunity could not be published.");

    if (applicationMethod === "internal_registration") {
      const publishing = body.status !== "draft";
      const { data: form, error: formError } = await db.from("opportunity_forms").insert({ opportunity_id: opportunity.id, organisation_id: membership.organisation_id, created_by_profile_id: profile.id, title: `${opportunity.title} registration`, description: "Organiser-created registration form", application_mode: "internal_form", status: publishing ? "published" : "draft", is_active: publishing, published_at: publishing ? new Date().toISOString() : null }).select("id").single();
      if (formError || !form) throw new Error("Opportunity was created, but its registration form could not be published.");
      const { data: section, error: sectionError } = await db.from("opportunity_form_sections").insert({ form_id: form.id, title: "Applicant and team details", description: "Information required by the organiser", sort_order: 0 }).select("id").single();
      if (sectionError || !section) throw new Error("Registration form section could not be created.");
      const baseFields = [
        ["applicant_name", "Applicant name", "short_text", true], ["email", "Email", "email", true],
        ["phone", "Phone number", "phone", true], ["college", "College name", "short_text", true],
        ["course_branch", "Course and branch", "short_text", true], ["graduation_year", "Graduation year", "number", true],
        ["team_name", "Team name", "short_text", false], ["team_size", "Team size", "number", true],
        ["project_description", "Project description", "long_text", false], ["consent", "I agree to the organiser rules", "consent_checkbox", true]
      ];
      const { error: fieldError } = await db.from("opportunity_form_fields").insert(baseFields.map(([fieldKey, label, fieldType, required], index) => ({ form_id: form.id, section_id: section.id, field_key: fieldKey, field_type: fieldType, label, required, sort_order: index, configuration: {}, validation_rules: {} })));
      if (fieldError) throw new Error("Registration form fields could not be created.");
    }
    return NextResponse.json({ data: opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opportunity publishing failed." }, { status: 500 });
  }
}
