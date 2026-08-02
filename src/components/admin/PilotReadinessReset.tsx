"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
export function PilotReadinessReset() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  async function reset() { if (!email.trim()) return; setBusy(true); setError(""); setNotice(""); try { const response = await fetch("/api/admin/readiness-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const payload = await response.json() as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Reset failed."); setNotice("The test account can generate one new pilot report."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Reset failed."); } finally { setBusy(false); } }
  return <div>{error ? <StatusMessage tone="error" className="mb-3">{error}</StatusMessage> : null}{notice ? <StatusMessage tone="success" className="mb-3">{notice}</StatusMessage> : null}<div className="flex flex-col gap-2 sm:flex-row"><label className="flex-1"><span className="sr-only">Founder email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Test founder email" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><Button onClick={() => void reset()} disabled={busy || !email.trim()}><RotateCcw size={16} />{busy ? "Resetting" : "Reset test report"}</Button></div></div>;
}
