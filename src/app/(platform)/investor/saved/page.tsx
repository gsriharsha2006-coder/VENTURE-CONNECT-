import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SavedStartupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Private review list"
        title="Saved applications"
        description="Applications saved by reviewers in your organisation will appear here."
      />
      <EmptyState
        icon={Bookmark}
        title="No saved applications"
        description="There are no saved application records for this account."
      />
    </div>
  );
}
