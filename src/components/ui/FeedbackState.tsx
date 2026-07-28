import { AlertCircle, CheckCircle2, Inbox, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-900"
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900"
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-200 bg-rose-50 text-rose-900"
  }
} as const;

export function StatusMessage({
  children,
  tone = "info",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof statusStyles;
  className?: string;
}) {
  const config = statusStyles[tone];
  const Icon = config.icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border p-4 text-sm leading-6", config.className, className)}
    >
      <Icon aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center", className)}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-primary">
        <Icon aria-hidden="true" size={21} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-64 animate-pulse rounded-lg border border-slate-200 bg-white p-5", className)}
    >
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-5 h-6 w-2/3 rounded bg-slate-200" />
      <div className="mt-4 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
      <div className="mt-8 h-10 w-full rounded bg-slate-100" />
    </div>
  );
}
