import { BriefcaseBusiness, MapPin, MessageSquareLock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Investor } from "@/lib/types";

export function InvestorCard({ investor }: { investor: Investor }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge>{investor.badge}</Badge>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{investor.name}</h3>
          <p className="text-sm font-medium text-slate-500">
            {investor.designation}, {investor.firm}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-primary">{investor.matchScore}</p>
          <p className="text-[11px] font-semibold text-blue-700">match</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{investor.thesis}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {investor.sectors.map((sector) => (
          <span key={sector} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {sector}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <BriefcaseBusiness size={16} className="text-primary" />
          {investor.stage} / {investor.ticketSize}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          {investor.geography}
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
          <span>Thesis fit</span>
          <span>{investor.matchScore}%</span>
        </div>
        <ProgressBar value={investor.matchScore} />
      </div>

      <Button className="mt-5 w-full" variant="secondary">
        <MessageSquareLock size={16} />
        VC can initiate
      </Button>
    </Card>
  );
}
