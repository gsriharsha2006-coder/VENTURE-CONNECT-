import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function OrganisationInsightsPage() {
  await requireRole(["investor", "incubator", "hackathon_organizer", "event_organizer"]);
  return <div className="space-y-6"><PageHeader eyebrow="Organisation analytics" title="Insights" description="Verified application and programme activity will aggregate here without invented traffic or outcome figures." /><EmptyState icon={BarChart3} title="No verified activity yet" description="Publish an opportunity and receive real applications before insights are calculated." /></div>;
}
