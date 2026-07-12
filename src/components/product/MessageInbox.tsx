import { LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { messageThreads } from "@/lib/data";

export function MessageInbox() {
  return (
    <Card>
      <CardHeader
        eyebrow="Messaging"
        title="Investor-initiated conversations"
        action={<Badge tone="green">Spam protected</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {messageThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{thread.investor}</p>
                  <p className="text-xs text-slate-500">
                    {thread.firm} / {thread.startup}
                  </p>
                </div>
                {thread.unread ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{thread.lastMessage}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="slate">{thread.badge}</Badge>
                <Badge tone="blue">{thread.status}</Badge>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <span className="rounded-lg bg-primary p-3 text-white">
              <MessageCircle size={20} />
            </span>
            <div>
              <p className="font-semibold text-slate-950">Maya Srinivasan</p>
              <p className="text-sm text-slate-500">BluePeak Ventures / Verified VC</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="max-w-[88%] rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
              Your pilot retention data is strong. Can you share cohort-level usage and procurement cycle assumptions?
            </div>
            <div className="ml-auto max-w-[88%] rounded-lg bg-primary p-3 text-sm leading-6 text-white shadow-panel">
              Yes. We have three cohorts segmented by hospital size and a 42-day average procurement path.
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            <LockKeyhole size={16} />
            Founder replies are enabled because the investor initiated interest.
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
              placeholder="Reply with data room context..."
            />
            <Button>Send</Button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
        <ShieldCheck size={17} className="text-emerald-600" />
        Messaging rule: investors can initiate; founders can reply only after investor interest.
      </div>
    </Card>
  );
}
