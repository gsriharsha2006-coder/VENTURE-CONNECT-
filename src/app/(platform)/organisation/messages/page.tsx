import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";
export default async function OrganisationMessagesPage() { await requireRole(["incubator"]); return <div className="space-y-6"><PageHeader eyebrow="Incubator messages" title="Permission-based conversations" description="Conversations open only after Interested or Request Information actions on submitted applications." /><MessagingPanel /></div>; }
