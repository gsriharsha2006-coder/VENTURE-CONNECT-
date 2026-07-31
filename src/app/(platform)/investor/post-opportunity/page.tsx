import { FilePlus2 } from "lucide-react";
import { EmptyState, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PostOpportunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Institution workspace"
        title="Post an opportunity"
        description="Create a programme listing after your organisation and publishing permissions have been verified."
      />
      <StatusMessage>
        Opportunity publishing is unavailable until the organisation record and review workflow are connected.
      </StatusMessage>
      <EmptyState
        icon={FilePlus2}
        title="Publishing setup required"
        description="Verified institutions will be able to draft eligibility, deadlines, application methods and official source details here."
      />
    </div>
  );
}
