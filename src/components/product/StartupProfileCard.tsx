import { Globe2, Linkedin, PlayCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { StartupProfile } from "@/lib/types";

export function StartupProfileCard({ startup }: { startup: StartupProfile }) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          {startup.logo}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{startup.name}</h3>
            <Badge tone="slate">{startup.stage}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {startup.founder} / {startup.university}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {startup.industry} startup based in {startup.location}. {startup.traction}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Growth", startup.monthlyGrowth],
          ["Active users", startup.activeUsers],
          ["Retention", startup.retention]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
          <span className="inline-flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Readiness score
          </span>
          <span>{startup.readiness}%</span>
        </div>
        <ProgressBar value={startup.readiness} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
          <PlayCircle size={16} />
          {startup.demoVideo}
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
          <Globe2 size={16} />
          {startup.website.replace("https://", "")}
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
          <Linkedin size={16} />
          LinkedIn
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{startup.fundingStatus}</p>
          <p className="text-xs text-slate-500">Ask: {startup.ask}</p>
        </div>
        <Badge tone="green">{startup.deckStatus}</Badge>
      </div>
    </Card>
  );
}
