import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export default function MessagingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Messages"
        title="Interest-gated conversations"
        description="Threads unlock only after an incubator marks an application Interested or requests information."
      />
      <MessagingPanel />
    </div>
  );
}
