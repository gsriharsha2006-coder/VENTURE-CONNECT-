import { Building2 } from "lucide-react";
import { EmptyState, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";

export default function InstitutionProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation settings"
        title="Institution profile"
        description="Manage the public information and application context associated with your organisation."
      />
      <StatusMessage>
        Profile editing will become available after organisation identity and member permissions are connected.
      </StatusMessage>
      <EmptyState
        icon={Building2}
        title="No organisation profile available"
        description="Connect the account to a verified organisation record before publishing public details."
      />
    </div>
  );
}
