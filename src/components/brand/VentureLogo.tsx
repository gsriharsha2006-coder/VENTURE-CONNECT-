import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

type VentureLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  invert?: boolean;
};

export function VentureLogo({
  href = "/",
  compact = false,
  className,
  invert = false
}: VentureLogoProps) {
  const content = (
    <span className={cn("flex items-center gap-3", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 p-1 shadow-panel">
        <span className="flex h-full w-full items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
          VC
        </span>
      </span>
      {!compact ? (
        <span>
          <span className={cn("block text-sm font-semibold", invert ? "text-white" : "text-slate-950")}>
            Venture Connect
          </span>
          <span className={cn("block text-xs font-medium", invert ? "text-blue-100" : "text-slate-500")}>
            VC readiness platform
          </span>
        </span>
      ) : null}
    </span>
  );

  return href ? <Link href={href as Route}>{content}</Link> : content;
}
