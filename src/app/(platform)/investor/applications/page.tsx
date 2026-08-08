import type { SupabaseClient } from "@supabase/supabase-js";
import { ApplicationQueueActions } from "@/components/organisations/ApplicationQueueActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function OrganisationApplicationQueuePage() {
  const { profile, role, supabase } = await requireRole(["investor", "incubator", "hackathon_organizer", "event_organizer"]);
  const organiserMode = role === "hackathon_organizer" || role === "event_organizer";
  const db = supabase as unknown as SupabaseClient;
  const { data: memberships } = await db.from("organisation_members").select("organisation_id").eq("profile_id", profile.id).eq("status", "active");
  const organisationIds = (memberships ?? []).map((item) => item.organisation_id);
  const { data: applications } = organisationIds.length
    ? await db.from("applications").select("id, status, submitted_at, answers_json, quality_status, application_snapshots(application_json, quality_result_json), opportunity:opportunities(title, opportunity_type), founder:profiles!applications_founder_profile_id_fkey(full_name)").in("organisation_id", organisationIds).neq("status", "draft").order("submitted_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation review"
        title="Application Queue"
        description="Review only fixed submissions sent to your organisation. Founder master documents and draft quality checks remain private."
      />
      {!applications?.length ? (
        <EmptyState title="No submitted applications" description="Applications will appear after a founder completes the correct submission workflow." />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const answers = (application.answers_json ?? {}) as Record<string, unknown>;
            const snapshots = Array.isArray(application.application_snapshots) ? application.application_snapshots : [];
            const quality = (snapshots[0]?.quality_result_json ?? {}) as Record<string, unknown>;
            const opportunity = Array.isArray(application.opportunity) ? application.opportunity[0] : application.opportunity;
            const founder = Array.isArray(application.founder) ? application.founder[0] : application.founder;
            return (
              <Card key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{String(application.status).replaceAll("_", " ")}</Badge>
                      {application.quality_status !== "not_applicable" ? <Badge tone="green">Application quality {String(quality.score ?? "Recorded")}</Badge> : <Badge tone="slate">Organiser form</Badge>}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{String(answers.startupName ?? answers.team_name ?? "Application")}</h2>
                    <p className="mt-1 text-sm text-slate-600">{founder?.full_name ?? "Founder"} / {opportunity?.title ?? "Opportunity"}</p>
                  </div>
                  <p className="text-xs text-slate-500">Submitted {new Date(application.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p className="rounded-lg bg-slate-50 p-3"><strong>Sector</strong><br />{String(answers.sector ?? "Not provided")}</p>
                  <p className="rounded-lg bg-slate-50 p-3"><strong>Stage</strong><br />{String(answers.startupStage ?? "Not provided")}</p>
                  <p className="rounded-lg bg-slate-50 p-3"><strong>Funding</strong><br />{String(answers.fundingRequirement ?? "Not provided")}</p>
                </div>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <ApplicationQueueActions applicationId={application.id} organiserMode={organiserMode} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
