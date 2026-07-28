"use client";

import { usePathname } from "next/navigation";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export default function MessagingPage() {
  const investorMode = usePathname().startsWith("/investor");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Messages"
        title={investorMode ? "Founder conversations" : "Interest-gated conversations"}
        description={investorMode
          ? "Send messages, feedback, and meeting details after marking a founder application Interested."
          : "Threads unlock only after an investor or incubator marks an application Interested."}
      />
      <MessagingPanel />
    </div>
  );
}
