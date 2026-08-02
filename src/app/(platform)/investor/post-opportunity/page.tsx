import { PageHeader } from "@/components/ui/PageHeader";
import { OpportunityPublisher } from "@/components/organisations/OpportunityPublisher";
import { requireRole } from "@/lib/auth/server";

export default async function PostOpportunityPage() {
  const { role } = await requireRole(["investor", "incubator", "hackathon_organizer", "event_organizer"]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Institution workspace"
        title="Post an opportunity"
        description="Create a programme listing after your organisation and publishing permissions have been verified."
      />
      <OpportunityPublisher role={role} />
    </div>
  );
}
