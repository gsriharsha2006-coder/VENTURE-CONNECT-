import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ClipboardCheck, FilePlus2, MessageSquare, Timer } from "lucide-react";
import { OrganisationOnboarding } from "@/components/organisations/OrganisationOnboarding";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function OrganisationOverviewPage() {
  const { profile, role, supabase } = await requireRole(["incubator", "hackathon_organizer"]);
  const db = supabase as unknown as SupabaseClient;
  const { data: membership } = await db.from("organisation_members").select("organisation_id, organisation:organisations(name, verification_status)").eq("profile_id", profile.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership) return <OrganisationOnboarding role={role} />;
  const organisation = Array.isArray(membership.organisation) ? membership.organisation[0] : membership.organisation;
  const [{ count: published }, { count: drafts }, { count: applications }, { count: underReview }, { count: interested }] = await Promise.all([
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("organisation_id", membership.organisation_id).eq("status", "published"),
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("organisation_id", membership.organisation_id).eq("status", "draft"),
    db.from("applications").select("id", { count: "exact", head: true }).eq("organisation_id", membership.organisation_id).neq("status", "draft"),
    db.from("applications").select("id", { count: "exact", head: true }).eq("organisation_id", membership.organisation_id).eq("status", "under_review"),
    db.from("applications").select("id", { count: "exact", head: true }).eq("organisation_id", membership.organisation_id).in("status", role === "incubator" ? ["interested", "needs_changes"] : ["shortlisted", "selected"])
  ]);
  const metrics = role === "incubator"
    ? [["Active programs", published ?? 0, FilePlus2], ["Applications received", applications ?? 0, ClipboardCheck], ["Applications under review", underReview ?? 0, Timer], ["Interested applications", interested ?? 0, MessageSquare]] as const
    : [["Published hackathons", published ?? 0, FilePlus2], ["Draft hackathons", drafts ?? 0, Timer], ["Registrations received", applications ?? 0, ClipboardCheck], ["Shortlisted or selected", interested ?? 0, MessageSquare]] as const;
  return <div className="space-y-6"><PageHeader eyebrow={`${role === "incubator" ? "Incubator" : "Hackathon organiser"} overview`} title={organisation?.name ?? "Organisation workspace"} description={`Verification: ${organisation?.verification_status ?? "pending"}. Manage only the records submitted to this organisation.`} actions={<Link href="/organisation/publish"><Button><FilePlus2 size={16} />{role === "incubator" ? "Post Program" : "Post Hackathon"}</Button></Link>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, Icon]) => <Card key={label}><Icon size={20} className="text-primary" /><p className="mt-4 text-3xl font-semibold">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></Card>)}</div></div>;
}
