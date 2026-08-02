"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, MessageSquareMore, SearchCheck, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";

type Action = "under_review" | "request_information" | "interested" | "shortlist" | "select" | "waitlist" | "decline";

export function ApplicationQueueActions({ applicationId, organiserMode = false }: { applicationId: string; organiserMode?: boolean }) {
  const [busy, setBusy] = useState<Action | null>(null); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function run(action: Action) { setBusy(action); setError(""); setNotice(""); try { const response = await fetch(`/api/submissions/${applicationId}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); const payload = await response.json() as { error?: string; status?: string }; if (!response.ok) throw new Error(payload.error ?? "Action could not be completed."); setNotice(action === "interested" || action === "request_information" ? "Conversation created and founder notified." : `Application updated: ${payload.status ?? action}.`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Action could not be completed."); } finally { setBusy(null); } }
  const actions: Array<[Action, string, LucideIcon]> = organiserMode
    ? [["under_review", "Under review", SearchCheck], ["shortlist", "Shortlist", CheckCircle2], ["select", "Select", CheckCircle2], ["waitlist", "Waitlist", MessageSquareMore], ["decline", "Reject", XCircle]]
    : [["under_review", "Under review", SearchCheck], ["request_information", "Request information", MessageSquareMore], ["interested", "Interested", CheckCircle2], ["decline", "Decline", XCircle]];
  return <div>{error ? <StatusMessage tone="error" className="mb-3">{error}</StatusMessage> : null}{notice ? <StatusMessage tone="success" className="mb-3">{notice}</StatusMessage> : null}<div className="flex flex-wrap gap-2">{actions.map(([action, label, Icon]) => <Button key={action} size="sm" variant={action === "interested" ? "primary" : "secondary"} disabled={Boolean(busy)} onClick={() => void run(action)}>{busy === action ? <LoaderCircle size={15} className="animate-spin" /> : <Icon size={15} />}{label}</Button>)}</div></div>;
}
