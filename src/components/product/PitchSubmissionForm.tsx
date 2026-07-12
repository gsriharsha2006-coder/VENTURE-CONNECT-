"use client";

import { UploadCloud, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const fields = [
  { label: "Startup name", placeholder: "MedLens AI" },
  { label: "Problem", placeholder: "Small hospitals lose hours to triage documentation" },
  { label: "Solution", placeholder: "AI workflow assistant that writes and routes triage notes" },
  { label: "Market", placeholder: "Tier-2 and tier-3 private hospitals" },
  { label: "Traction", placeholder: "3 paid pilots, 1.8k active users" },
  { label: "Funding ask", placeholder: "Rs 35L for 12-month pilot expansion" }
];

const filters = ["Sector", "Stage", "Geography", "Ticket size", "Investor thesis"];

export function PitchSubmissionForm() {
  return (
    <Card>
      <CardHeader
        eyebrow="Submit to investors"
        title="Application packet control room"
        action={<Badge tone="amber">Free plan: 1 active packet</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {fields.map((field) => (
          <label key={field.label} className="block">
            <span className="text-sm font-semibold text-slate-700">{field.label}</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-blue-100"
              placeholder={field.placeholder}
            />
          </label>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white p-3 text-primary shadow-sm">
              <UploadCloud size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-blue-950">Pitch deck and data room</p>
              <p className="text-sm text-blue-800">Attach pitch deck, documents, and saved VC Readiness Report.</p>
            </div>
          </div>
          <Button variant="secondary">Choose files</Button>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">Investor filters</p>
        <div className="grid gap-3 md:grid-cols-5">
          {filters.map((filter) => (
            <select
              key={filter}
              aria-label={filter}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            >
              <option>{filter}</option>
              <option>AI SaaS</option>
              <option>Pre-seed</option>
              <option>India</option>
              <option>Rs 10L - Rs 1Cr</option>
            </select>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Wand2 size={17} className="text-primary" />
          Founder packets include Idea Workspace, VC Readiness Report, and pitch deck assets.
        </p>
        <Button type="button">Submit application packet</Button>
      </div>
    </Card>
  );
}
