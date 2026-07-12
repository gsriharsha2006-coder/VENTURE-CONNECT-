import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  tone = "blue"
}: {
  value: number;
  className?: string;
  tone?: "blue" | "green" | "amber";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-700",
    green: "from-emerald-400 to-emerald-600",
    amber: "from-amber-300 to-amber-500"
  };

  return (
    <div className={cn("h-2 overflow-hidden rounded-md bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-md bg-gradient-to-r", colors[tone])}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
