import { PageHeader } from "@/components/ui/PageHeader";
import { OpportunityPublisher } from "@/components/organisations/OpportunityPublisher";
import { requireRole } from "@/lib/auth/server";

export default async function OrganisationPublishPage() {
  const { role } = await requireRole(["incubator", "hackathon_organizer"]);
  const hackathon = role === "hackathon_organizer";
  return <div className="space-y-6"><PageHeader eyebrow={hackathon ? "Hackathon organiser" : "Incubator"} title={hackathon ? "Post Hackathon" : "Post Program"} description="Save a draft, review the details, and publish when the opportunity is ready for founders." /><OpportunityPublisher role={role} /></div>;
}
