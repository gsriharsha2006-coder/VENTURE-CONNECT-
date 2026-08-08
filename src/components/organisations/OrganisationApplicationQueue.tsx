import type { SupabaseClient } from "@supabase/supabase-js";
import { ApplicationQueueActions } from "@/components/organisations/ApplicationQueueActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export async function OrganisationApplicationQueue({ interestedOnly = false }: { interestedOnly?: boolean }) {
  const { profile, role, supabase } = await requireRole(["incubator", "hackathon_organizer"]);
  const hackathon = role === "hackathon_organizer";
  const db = supabase as unknown as SupabaseClient;
  const { data: memberships } = await db.from("organisation_members").select("organisation_id").eq("profile_id", profile.id).eq("status", "active");
  const ids = (memberships ?? []).map((item) => item.organisation_id);
  let query = db.from("applications").select("id, status, submitted_at, answers_json, quality_status, application_snapshots(application_json, quality_result_json), opportunity:opportunities(title, opportunity_type), founder:profiles!applications_founder_profile_id_fkey(full_name)").in("organisation_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).neq("status", "draft").order("submitted_at", { ascending: false });
  if (interestedOnly) query = query.in("status", ["interested", "needs_changes"]);
  const { data: applications } = await query;
  return <div className="space-y-6"><PageHeader eyebrow={hackathon ? "Hackathon registrations" : interestedOnly ? "Incubator follow-up" : "Incubator review"} title={interestedOnly ? "Interested Applications" : "Applications"} description={hackathon ? "Review registrations submitted to your published hackathons." : "Review fixed founder submissions and their latest passing Application Quality Check."} />{!applications?.length ? <EmptyState title={interestedOnly ? "No interested applications" : "No submitted applications"} description="Applications will appear after founders complete the appropriate submission flow." /> : <div className="space-y-4">{applications.map((application) => {
    const snapshotRows = Array.isArray(application.application_snapshots) ? application.application_snapshots : [];
    const snapshot = (snapshotRows[0]?.application_json ?? application.answers_json ?? {}) as Record<string, unknown>;
    const quality = (snapshotRows[0]?.quality_result_json ?? {}) as Record<string, unknown>;
    const opportunity = Array.isArray(application.opportunity) ? application.opportunity[0] : application.opportunity;
    const founder = Array.isArray(application.founder) ? application.founder[0] : application.founder;
    const answers = (snapshot.answers ?? snapshot) as Record<string, unknown>;
    return <Card key={application.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge>{String(application.status).replaceAll("_", " ")}</Badge>{application.quality_status !== "not_applicable" ? <Badge tone="green">Application quality {String(quality.score ?? "recorded")}</Badge> : <Badge tone="slate">Hackathon registration</Badge>}</div><h2 className="mt-3 text-xl font-semibold">{String(answers.startupName ?? answers.team_name ?? answers.applicant_name ?? "Application")}</h2><p className="mt-1 text-sm text-slate-600">{founder?.full_name ?? "Founder / Student"} · {opportunity?.title ?? "Opportunity"}</p></div><p className="text-xs text-slate-500">{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "Submitted"}</p></div><details className="mt-5 rounded-lg border border-slate-200"><summary className="cursor-pointer p-3 text-sm font-semibold">View full original submission</summary><dl className="divide-y divide-slate-100 border-t border-slate-200">{Object.entries(answers).map(([key, value]) => <div key={key} className="grid gap-1 p-3 text-sm md:grid-cols-[220px_1fr]"><dt className="font-semibold text-slate-700">{key.replaceAll("_", " ")}</dt><dd className="whitespace-pre-wrap text-slate-600">{Array.isArray(value) ? value.join(", ") : String(value ?? "Not provided")}</dd></div>)}</dl></details><div className="mt-5 border-t border-slate-200 pt-4"><ApplicationQueueActions applicationId={application.id} organiserMode={hackathon} /></div></Card>;
  })}</div>}</div>;
}
