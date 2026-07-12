import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function MetricCard({
  label,
  value,
  delta
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-primary">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-emerald-600">{delta}</p>
    </Card>
  );
}
