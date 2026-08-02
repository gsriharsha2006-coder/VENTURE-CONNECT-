"use client";

import { useState } from "react";
import { Archive, CheckCircle2, CircleStop, Eye, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";

const initial = {
  title: "", organizer_name: "", guidelines: "", support_offered: "", duration: "", eligibility: "",
  accepted_categories: "", accepted_stages: "", eligible_colleges: "", eligible_locations: "", deadline: "",
  cohort_size: "", required_sections: "", custom_questions: "", contact_email: "", mode: "Remote", location: "",
  theme: "", problem_statements: "", event_start_date: "", event_end_date: "", team_size: "", prize_or_funding: "",
  rules: "", faqs: "", application_method: "internal_registration", external_link: "", official_website: ""
};

type Values = typeof initial;
type PublicationStatus = "draft" | "published" | "closed" | "archived";

export function OpportunityPublisher({ role }: { role: string }) {
  const hackathon = role === "hackathon_organizer";
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [savedStatus, setSavedStatus] = useState<PublicationStatus>("draft");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const definitionLocked = savedStatus !== "draft";

  function set(key: keyof Values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(status: PublicationStatus) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const opportunityType = hackathon ? "Hackathon" : "Incubator program";
      const response = await fetch(savedId ? `/api/opportunities/${savedId}` : "/api/opportunities", {
        method: savedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          opportunity_type: opportunityType,
          status,
          application_method: hackathon ? values.application_method : "idea_workspace_application",
          eligibility_rules: {
            acceptedSectors: values.accepted_categories.split(",").map((item) => item.trim()).filter(Boolean),
            acceptedStages: values.accepted_stages.split(",").map((item) => item.trim()).filter(Boolean),
            eligibleColleges: values.eligible_colleges.split(",").map((item) => item.trim()).filter(Boolean),
            acceptedGeographies: values.eligible_locations.split(",").map((item) => item.trim()).filter(Boolean),
            deadline: values.deadline
          },
          required_application_fields: values.required_sections.split(",").map((item) => item.trim()).filter(Boolean),
          application_instructions: values.custom_questions,
          category: hackathon ? values.theme || "Hackathon" : values.accepted_categories || "Incubation",
          venue: values.location
        })
      });
      const payload = await response.json() as { data?: { id?: string; title: string }; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error ?? "The opportunity could not be saved.");
      if (payload.data.id) setSavedId(payload.data.id);
      setSavedStatus(status);
      setNotice(status === "published"
        ? `${payload.data.title} is published for founders.`
        : status === "draft"
          ? `${payload.data.title} was saved as a draft.`
          : status === "closed"
            ? `${payload.data.title} is closed to new applications.`
            : `${payload.data.title} was archived.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The opportunity could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function Input({ name, label, type = "text", required = false, placeholder }: { name: keyof Values; label: string; type?: string; required?: boolean; placeholder?: string }) {
    return <label><span className="text-sm font-semibold">{label}</span><input type={type} required={required} value={values[name]} onChange={(event) => set(name, event.target.value)} placeholder={placeholder} disabled={definitionLocked} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>;
  }

  function Area({ name, label, required = false }: { name: keyof Values; label: string; required?: boolean }) {
    return <label className="md:col-span-2"><span className="text-sm font-semibold">{label}</span><textarea required={required} rows={3} value={values[name]} onChange={(event) => set(name, event.target.value)} disabled={definitionLocked} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" /></label>;
  }

  return (
    <div className="space-y-4">
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}
      {definitionLocked ? <StatusMessage>Published opportunity details are fixed for participant trust. You can close applications or archive the record.</StatusMessage> : null}

      {preview ? (
        <Card>
          <CardHeader eyebrow="Preview" title={values.title || (hackathon ? "Untitled hackathon" : "Untitled incubation program")} />
          <p className="text-sm leading-6 text-slate-600">{values.guidelines || "Add a programme description."}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Organisation</dt><dd>{values.organizer_name || "Not provided"}</dd></div>
            <div><dt className="font-semibold">Deadline</dt><dd>{values.deadline || "Not provided"}</dd></div>
            <div><dt className="font-semibold">Eligibility</dt><dd>{values.eligibility || "Not provided"}</dd></div>
            <div><dt className="font-semibold">Application method</dt><dd>{hackathon ? values.application_method.replaceAll("_", " ") : "Apply with Idea + Application Quality Check"}</dd></div>
          </dl>
        </Card>
      ) : null}

      <Card>
        <CardHeader eyebrow={hackathon ? "Hackathon details" : "Incubation program details"} title={hackathon ? "Create a practical registration opportunity" : "Create a structured incubation program"} />
        <form onSubmit={(event) => event.preventDefault()} className="grid gap-4 md:grid-cols-2">
          <Input name="title" label={hackathon ? "Hackathon title" : "Program name"} required />
          <Input name="organizer_name" label={hackathon ? "Organiser name" : "Incubator name"} required />
          <Area name="guidelines" label="Description" required />

          {hackathon ? <>
            <Input name="theme" label="Theme" />
            <Area name="problem_statements" label="Problem statements" />
            <Input name="event_start_date" label="Start date" type="date" />
            <Input name="event_end_date" label="End date" type="date" />
            <Input name="team_size" label="Team-size rules" placeholder="2-4 members" />
            <Input name="prize_or_funding" label="Prizes or benefits" />
            <Area name="rules" label="Rules and stages" />
            <Area name="faqs" label="FAQs" />
          </> : <>
            <Area name="support_offered" label="Support offered" />
            <Input name="duration" label="Program duration" />
            <Input name="cohort_size" label="Cohort size" />
            <Input name="accepted_categories" label="Accepted startup categories" placeholder="SaaS, AgriTech" />
            <Input name="accepted_stages" label="Accepted startup stages" placeholder="Idea, Prototype, MVP" />
            <Input name="required_sections" label="Required Startup Template sections" placeholder="problem, solution, customer_validation" />
            <Area name="custom_questions" label="Custom application questions" />
          </>}

          <Area name="eligibility" label="Eligibility summary" />
          <Input name="eligible_colleges" label="Eligible colleges" placeholder="PACE Institute, all colleges" />
          <Input name="eligible_locations" label="Eligible locations" />
          <Input name="deadline" label={hackathon ? "Registration deadline" : "Application deadline"} type="date" required />
          <label><span className="text-sm font-semibold">Mode</span><select value={values.mode} onChange={(event) => set("mode", event.target.value)} disabled={definitionLocked} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 disabled:bg-slate-100"><option>Remote</option><option>Offline</option><option>Hybrid</option></select></label>
          <Input name="location" label={hackathon ? "Venue or location" : "Program location"} />

          {hackathon ? <label><span className="text-sm font-semibold">Registration method</span><select value={values.application_method} onChange={(event) => set("application_method", event.target.value)} disabled={definitionLocked} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 disabled:bg-slate-100"><option value="internal_registration">Internal registration</option><option value="external_registration">Official registration website</option></select></label> : null}
          {hackathon && values.application_method === "external_registration" ? <Input name="external_link" label="Official registration URL" type="url" required /> : null}
          <Input name="official_website" label="Official website" type="url" />
          <Input name="contact_email" label="Contact email" type="email" required />

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="button" variant="secondary" onClick={() => void save("draft")} disabled={busy || definitionLocked}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}Save Draft</Button>
            <Button type="button" variant="secondary" onClick={() => setPreview((value) => !value)}><Eye size={16} />{preview ? "Close Preview" : "Preview"}</Button>
            <Button type="button" onClick={() => void save("published")} disabled={busy || definitionLocked}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Publish</Button>
            {savedId && savedStatus === "published" ? <Button type="button" variant="secondary" onClick={() => void save("closed")} disabled={busy}><CircleStop size={16} />Close applications</Button> : null}
            {savedId && savedStatus !== "archived" ? <Button type="button" variant="secondary" onClick={() => void save("archived")} disabled={busy}><Archive size={16} />Archive</Button> : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
