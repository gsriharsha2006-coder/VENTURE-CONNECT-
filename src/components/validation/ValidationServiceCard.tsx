import { CheckCircle2, IndianRupee, Video } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ValidationService } from "@/lib/validation/types";
import { cn } from "@/lib/utils";

export function ValidationServiceCard({
  service,
  selected,
  onSelect,
  actionLabel = "Select service"
}: {
  service: ValidationService;
  selected?: boolean;
  onSelect?: () => void;
  actionLabel?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col p-5", selected ? "border-blue-300 bg-blue-50/70 shadow-panel" : "")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={service.requiresLiveSession ? "blue" : "slate"}>
            {service.requiresLiveSession ? <Video size={13} /> : null}
            {service.requiresLiveSession ? "Live + report" : "Written"}
          </Badge>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{service.type}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
          <p className="flex items-center gap-0.5 text-xl font-semibold text-slate-950">
            <IndianRupee size={16} />
            {service.founderPrice}
          </p>
          <p className="text-[11px] font-medium text-slate-500">{service.expectedDelivery}</p>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {service.deliverables.map((deliverable) => (
          <p key={deliverable} className="flex gap-2 text-sm leading-5 text-slate-600">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            {deliverable}
          </p>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        Validator payout is released only after the required report, session completion when applicable, and dispute window.
      </div>

      {onSelect ? (
        <Button className="mt-5 w-full" variant={selected ? "primary" : "secondary"} onClick={onSelect}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
