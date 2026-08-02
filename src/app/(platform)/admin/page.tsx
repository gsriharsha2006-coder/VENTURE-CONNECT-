import type { SupabaseClient } from "@supabase/supabase-js";
import { Activity, ClipboardCheck, FileChartColumn, Lightbulb, MessageSquare, UsersRound } from "lucide-react";
import { PilotReadinessReset } from "@/components/admin/PilotReadinessReset";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function PilotAdminPage() {
  const { supabase } = await requireRole(["admin"]);
  const db = supabase as unknown as SupabaseClient;
  const [{ count: founders }, { count: ideas }, { count: completedIdeas }, { count: reports }, { count: startedApplications }, { count: submittedApplications }, { count: interestedApplications }, { count: hackathonRegistrations }, { data: events }] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "founder"),
    db.from("idea_workspaces").select("id", { count: "exact", head: true }),
    db.from("idea_workspaces").select("id", { count: "exact", head: true }).eq("status", "complete"),
    db.from("vc_reports").select("id", { count: "exact", head: true }).eq("report_type", "Basic SWOT Report"),
    db.from("applications").select("id", { count: "exact", head: true }),
    db.from("applications").select("id", { count: "exact", head: true }).neq("status", "draft"),
    db.from("applications").select("id", { count: "exact", head: true }).eq("status", "interested"),
    db.from("applications").select("id, opportunities!inner(opportunity_type)", { count: "exact", head: true }).eq("opportunities.opportunity_type", "Hackathon").neq("status", "draft"),
    db.from("pilot_events").select("profile_id, event_name, created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ]);
  const eventRows = events ?? [];
  const qualityFailures = eventRows.filter((item) => item.event_name === "quality_check_failed").length;
  const corrected = eventRows.filter((item) => item.event_name === "application_corrected").length;
  const returning = new Set(eventRows.map((item) => item.profile_id).filter(Boolean)).size;
  const metrics = [
    ["Registered founders", founders ?? 0, UsersRound], ["Ideas created", ideas ?? 0, Lightbulb], ["Completed ideas", completedIdeas ?? 0, Lightbulb],
    ["Readiness reports", reports ?? 0, FileChartColumn], ["Applications started", startedApplications ?? 0, ClipboardCheck], ["Applications submitted", submittedApplications ?? 0, ClipboardCheck],
    ["Quality checks failed", qualityFailures, Activity], ["Applications corrected", corrected, Activity], ["Marked Interested", interestedApplications ?? 0, MessageSquare],
    ["Hackathon registrations", hackathonRegistrations ?? 0, ClipboardCheck], ["Returning pilot users", returning, UsersRound]
  ] as const;
  return <div className="space-y-6"><PageHeader eyebrow="Pilot administration" title="PACE one-month pilot summary" description="Operational counts only. Private startup answers are not exposed in analytics." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{metrics.map(([label, value, Icon]) => <Card key={label}><Icon size={20} className="text-primary" /><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></Card>)}</div><Card><CardHeader eyebrow="Test-account administration" title="Reset one pilot readiness report" /><p className="mb-4 text-sm leading-6 text-slate-600">Use only for authorised test accounts. Normal founders cannot access this reset.</p><PilotReadinessReset /></Card></div>;
}
