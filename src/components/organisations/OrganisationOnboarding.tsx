"use client";

import { useState } from "react";
import { Building2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";

export function OrganisationOnboarding({ role }: { role: string }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/organisations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, website, location, description }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Organisation profile could not be created.");
      window.location.reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Organisation profile could not be created."); }
    finally { setBusy(false); }
  }

  return <Card className="mx-auto max-w-2xl"><CardHeader eyebrow="Organisation onboarding" title="Create the organisation workspace" /><p className="text-sm leading-6 text-slate-600">Your account type is {role.replaceAll("_", " ")}. Organisation verification remains pending until an administrator reviews the profile.</p>{error ? <StatusMessage tone="error" className="mt-4">{error}</StatusMessage> : null}<form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold">Organisation name</span><div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3"><Building2 size={16} className="text-slate-400" /><input required value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full outline-none" /></div></label><label><span className="text-sm font-semibold">Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3" /></label><label className="sm:col-span-2"><span className="text-sm font-semibold">Website</span><input type="url" placeholder="https://" value={website} onChange={(event) => setWebsite(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3" /></label><label className="sm:col-span-2"><span className="text-sm font-semibold">About the organisation</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><Button type="submit" className="sm:col-span-2" disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Building2 size={16} />}Create organisation workspace</Button></form></Card>;
}
