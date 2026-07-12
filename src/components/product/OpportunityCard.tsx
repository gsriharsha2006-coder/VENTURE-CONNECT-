import { Bookmark, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={opportunity.premium ? "amber" : "blue"}>
              {opportunity.premium ? "Premium" : opportunity.type}
            </Badge>
            {opportunity.verified ? (
              <Badge tone="green">
                <ShieldCheck size={13} />
                Verified
              </Badge>
            ) : null}
          </div>
          <h3 className="text-base font-semibold text-slate-950">{opportunity.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{opportunity.organization}</p>
        </div>
        <button
          type="button"
          aria-label="Bookmark opportunity"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-primary"
        >
          <Bookmark size={17} />
        </button>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{opportunity.description}</p>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          {opportunity.location}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          {opportunity.deadline}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">{opportunity.funding}</p>
          <p className="text-xs text-slate-500">{opportunity.applicants} applicants</p>
        </div>
        <Button size="sm">Apply</Button>
      </div>
    </Card>
  );
}
