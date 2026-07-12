"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Calendar, LockKeyhole, MessageCircle, Send, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { messageThreads } from "@/lib/data";
import { createInterestedConversation } from "@/lib/data/messages";

export function MessagingPanel() {
  const pathname = usePathname();
  const investorMode = pathname.startsWith("/investor");
  const [selectedId, setSelectedId] = useState(messageThreads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<"Message" | "Feedback" | "Meeting">("Message");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [scheduledMeeting, setScheduledMeeting] = useState<{ time: string; link: string } | null>(null);
  const selected = useMemo(
    () => messageThreads.find((thread) => thread.id === selectedId) ?? messageThreads[0],
    [selectedId]
  );

  if (!selected) {
    return (
      <Card className="p-8 text-center">
        <MessageCircle className="mx-auto text-primary" size={40} />
        <h2 className="mt-4 text-xl font-semibold">No interest-led conversations yet</h2>
        <p className="mt-2 text-sm text-slate-600">Conversations appear only after an investor or incubator marks Interested.</p>
      </Card>
    );
  }

  const lockedForFree = !investorMode && selected.founderPlan === "Free";

  function sendMessage() {
    if (!draft.trim() || lockedForFree) return;
    const body = draft.trim();
    if (messageType === "Meeting") {
      if (!meetingTime || !meetingLink) return;
      setScheduledMeeting({ time: meetingTime, link: meetingLink });
    }
    void createInterestedConversation({
      applicationId: selected.id,
      body: `${messageType}: ${body}`,
      meetingLink: messageType === "Meeting" ? meetingLink : undefined,
      meetingTime: messageType === "Meeting" ? meetingTime : undefined,
      lockedForFreeUser: lockedForFree
    });
    setSent((current) => [...current, `${messageType}: ${body}`]);
    setDraft("");
  }

  return (
    <div className="grid min-h-[640px] gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col overflow-hidden p-0">
        <div className="border-b border-slate-200 p-4">
          <CardHeader eyebrow="Interested Threads" title={investorMode ? "Founder conversations" : "Reviewer conversations"} className="mb-0" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {messageThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedId(thread.id)}
              className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selectedId === thread.id ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{thread.startup}</p>
                  <p className="mt-1 text-xs text-slate-500">{thread.firm}</p>
                </div>
                {thread.unread ? <Badge tone="amber">New</Badge> : null}
              </div>
              <Badge tone={!investorMode && thread.founderPlan === "Free" ? "amber" : "green"} className="mt-3">
                {!investorMode && thread.founderPlan === "Free" ? "Locked preview" : "Full chat"}
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden p-0">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{selected.startup}</h2>
                <Badge tone="green">{selected.status}</Badge>
                <Badge tone="slate">{selected.badge}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{selected.investor} / {selected.firm}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={lockedForFree}>
                <Video size={14} />
                Meeting
              </Button>
            </div>
          </div>
        </div>

        {lockedForFree ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <LockKeyhole size={18} className="mt-0.5 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">An investor is interested in your startup.</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Upgrade to access the conversation and meeting details. Free founders can view interest and a short feedback paragraph only.
                </p>
                <Link href="/pricing" className="mt-3 inline-flex text-sm font-semibold text-primary">View plans</Link>
              </div>
            </div>
          </div>
        ) : scheduledMeeting || selected.meetingLink ? (
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-blue-900">
              <Calendar size={16} />
              <span>{scheduledMeeting?.time ? new Date(scheduledMeeting.time).toLocaleString() : selected.meetingTime ? new Date(selected.meetingTime).toLocaleString() : "Meeting proposed"}</span>
              <a href={scheduledMeeting?.link ?? selected.meetingLink} target="_blank" rel="noreferrer" className="font-semibold underline">Open meeting link</a>
            </div>
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
            <p>{selected.lastMessage}</p>
            <p className="mt-1 text-[10px] text-slate-500">{lockedForFree ? "Feedback preview" : "Investor message"}</p>
          </div>

          {!lockedForFree && sent.map((message, index) => (
            <div key={`${message}-${index}`} className="ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-white">
              {message}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 p-4">
          {investorMode ? (
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              <select value={messageType} onChange={(event) => setMessageType(event.target.value as "Message" | "Feedback" | "Meeting")} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                <option>Message</option>
                <option>Feedback</option>
                <option>Meeting</option>
              </select>
              {messageType === "Meeting" ? (
                <>
                  <input type="datetime-local" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                  <input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="Zoom, Meet, or external link" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                </>
              ) : null}
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              value={draft}
              disabled={lockedForFree}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              placeholder={lockedForFree ? "Upgrade to reply after investor interest" : investorMode ? `Send ${messageType.toLowerCase()}...` : "Reply after interest..."}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-slate-50"
            />
            <Button onClick={sendMessage} disabled={lockedForFree}>
              <Send size={16} />
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {investorMode
              ? "Send a message, short feedback, or meeting time with a Zoom, Meet, or external link."
              : "Investors and incubators can start a thread only after marking an application Interested."}
          </p>
        </div>
      </Card>
    </div>
  );
}
