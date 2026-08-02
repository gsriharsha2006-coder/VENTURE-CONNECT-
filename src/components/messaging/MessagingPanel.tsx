"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, StatusMessage } from "@/components/ui/FeedbackState";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { pilotDemoMessages } from "@/lib/pilot/demo-data";

type Conversation = {
  id: string;
  applicationId: string;
  programme: string;
  startup: string;
  organisation: string;
  authorizationReason: string;
  status: string;
};

type Message = { id: string; message: string; created_at: string; sender_profile_id?: string | null };

function normalizeConversation(value: unknown): Conversation | null {
  if (!value || typeof value !== "object") return null;
  const member = value as Record<string, unknown>;
  const raw = member.conversation;
  const conversation = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null;
  if (!conversation || typeof conversation.id !== "string") return null;
  const applicationRaw = conversation.application;
  const application = (Array.isArray(applicationRaw) ? applicationRaw[0] : applicationRaw) as Record<string, unknown> | null;
  const opportunityRaw = application?.opportunity;
  const opportunity = (Array.isArray(opportunityRaw) ? opportunityRaw[0] : opportunityRaw) as Record<string, unknown> | null;
  const workspaceRaw = application?.workspace;
  const workspace = (Array.isArray(workspaceRaw) ? workspaceRaw[0] : workspaceRaw) as Record<string, unknown> | null;
  return {
    id: conversation.id,
    applicationId: String(conversation.application_id ?? application?.id ?? "Application"),
    programme: String(opportunity?.title ?? "Incubation program"),
    startup: String(workspace?.title ?? "Startup idea"),
    organisation: String(opportunity?.organizer_name ?? "Incubator"),
    authorizationReason: String(conversation.authorization_reason ?? "interested"),
    status: String(conversation.status ?? "active")
  };
}

export function MessagingPanel() {
  const demoEnabled = isDemoDataEnabled();
  const [conversations, setConversations] = useState<Conversation[]>(demoEnabled ? pilotDemoMessages.map((thread) => ({ id: thread.id, applicationId: thread.id, programme: "PACE Student Venture Pilot Cohort", startup: thread.startup, organisation: thread.firm, authorizationReason: "interested", status: "active" })) : []);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/conversations", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { conversations?: unknown[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Conversations could not be loaded.");
        const rows = (payload.conversations ?? []).map(normalizeConversation).filter((item): item is Conversation => Boolean(item));
        if (active) { setConversations(rows); setSelectedId(rows[0]?.id ?? ""); }
      })
      .catch((reason) => { if (active && !demoEnabled) setError(reason instanceof Error ? reason.message : "Conversations could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [demoEnabled]);

  useEffect(() => {
    if (!selectedId || (demoEnabled && selectedId.startsWith("thread"))) return;
    let active = true;
    setLoading(true);
    void fetch(`/api/conversations/${selectedId}/messages`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { messages?: Message[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Messages could not be loaded.");
        if (active) setMessages(payload.messages ?? []);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Messages could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [demoEnabled, selectedId]);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId) ?? conversations[0], [conversations, selectedId]);

  async function send() {
    const message = draft.trim();
    if (!selected || !message || sending) return;
    setSending(true); setError(""); setNotice("");
    try {
      if (demoEnabled && selected.id.startsWith("thread")) {
        setMessages((current) => [...current, { id: `demo-${Date.now()}`, message, created_at: new Date().toISOString() }]);
      } else {
        const response = await fetch(`/api/conversations/${selected.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
        const payload = await response.json() as { message?: Message; error?: string };
        if (!response.ok || !payload.message) throw new Error(payload.error ?? "Message could not be sent.");
        setMessages((current) => [...current, payload.message as Message]);
      }
      setDraft(""); setNotice("Message sent.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Message could not be sent.");
    } finally { setSending(false); }
  }

  if (!loading && !selected) return <EmptyState icon={MessageCircle} title="No permitted conversations" description="A conversation appears only after an incubator marks a submitted application Interested or sends Request Information. Founders cannot start conversations." />;

  return (
    <div className="space-y-4">
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}
      <div className="grid min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden p-0"><div className="border-b border-slate-200 p-4"><CardHeader eyebrow="Permission-based messaging" title="Incubation conversations" className="mb-0" /></div>{loading && !conversations.length ? <p className="p-4 text-sm text-slate-500">Loading conversations...</p> : conversations.map((conversation) => <button key={conversation.id} type="button" aria-pressed={selected?.id === conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full border-b border-slate-100 p-4 text-left ${selected?.id === conversation.id ? "bg-blue-50" : "hover:bg-slate-50"}`}><p className="text-sm font-semibold">{conversation.organisation}</p><p className="mt-1 text-xs text-slate-500">{conversation.programme}</p><Badge tone="green" className="mt-3">{conversation.authorizationReason === "request_information" ? "Information requested" : "Interested"}</Badge></button>)}</Card>
        <Card className="flex flex-col overflow-hidden p-0">
          {selected ? <><header className="border-b border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{selected.organisation}</h2><p className="mt-1 text-sm text-slate-600">{selected.programme}</p></div><Badge tone="green">{selected.status}</Badge></div><dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2"><div><dt className="font-semibold text-slate-700">Startup idea</dt><dd>{selected.startup}</dd></div><div><dt className="font-semibold text-slate-700">Related application</dt><dd>{selected.applicationId}</dd></div></dl></header><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">{loading ? <p className="text-sm text-slate-500">Loading messages...</p> : !messages.length ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">No text messages yet. The incubator opened this permitted conversation.</p> : messages.map((message) => <div key={message.id} className="max-w-[85%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><p>{message.message}</p><p className="mt-1 text-xs text-slate-400">{new Date(message.created_at).toLocaleString()} · Sent</p></div>)}</div><footer className="border-t border-slate-200 p-4"><label htmlFor="conversation-message" className="sr-only">Message</label><div className="flex gap-2"><textarea id="conversation-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={8000} placeholder="Write a text message" className="min-h-11 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100" /><Button onClick={() => void send()} disabled={!draft.trim() || sending}><Send size={16} />{sending ? "Sending" : "Send"}</Button></div><p className="mt-2 text-xs text-slate-500">Text messaging only. No meetings, calls, files, or founder-initiated conversations are available in the pilot.</p></footer></> : null}
        </Card>
      </div>
    </div>
  );
}
