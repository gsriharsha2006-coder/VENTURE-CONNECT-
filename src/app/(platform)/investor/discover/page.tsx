import Link from "next/link";
import { ClipboardCheck, FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrganisationOnboarding } from "@/components/organisations/OrganisationOnboarding";
import { requireRole } from "@/lib/auth/server";

export default async function InstitutionDashboardPage() {
  const { profile, role, supabase } = await requireRole(["investor", "incubator", "hackathon_organizer", "event_organizer"]);
  const { data: memberships } = await supabase.from("organisation_members").select("organisation_id, organisation:organisations(name, verification_status)").eq("profile_id", profile.id).eq("status", "active").limit(1);
  if (!memberships?.length) return <OrganisationOnboarding role={role} />;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Institution workspace"
        title="Manage programmes and review authorised applications."
        description="Published opportunities, assigned applications, and interest-gated conversations will appear from authenticated organisation records."
        actions={(
          <Link href="/investor/post-opportunity"><Button><FilePlus2 aria-hidden="true" size={16} />Post opportunity</Button></Link>
        )}
      />
      <EmptyState
        title="No organisation records are available"
        description="Join or create an approved organisation before publishing a programme or reviewing founder applications. Venture Connect does not display sample applicants or activity metrics here."
        icon={Search}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader eyebrow="Programme setup" title="Publish with a clear application method" />
          <p className="text-sm leading-6 text-slate-600">Choose a Venture Connect form, an Idea Workspace application, or the organiser&apos;s official external route. Verification status remains visible.</p>
        </Card>
        <Card>
          <CardHeader eyebrow="Application review" title="Decisions stay inside assigned workflows" />
          <p className="text-sm leading-6 text-slate-600">Only authorised organisation members and assigned reviewers can access applications. Conversations open after an Interested decision.</p>
          <Link href="/applications"><Button variant="secondary" className="mt-4"><ClipboardCheck aria-hidden="true" size={16} />Open applications</Button></Link>
        </Card>
      </div>
    </div>
  );
}
