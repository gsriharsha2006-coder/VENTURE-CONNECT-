import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";

export default function InterestedStartupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Application review"
        title="Interested startups"
        description="Startups marked during an authorised application review will appear here."
      />
      <EmptyState
        icon={Star}
        title="No interest decisions recorded"
        description="Interest can be recorded after an institution receives and reviews an application. No review records are available for this account."
      />
    </div>
  );
}
