import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ValidatorAvatar({
  name,
  verified,
  size = "md",
  className
}: {
  name: string;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const sizes = {
    sm: "h-11 w-11 text-sm",
    md: "h-14 w-14 text-base",
    lg: "h-24 w-24 text-2xl"
  };

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 via-white to-slate-200 font-bold text-primary shadow-sm ring-1 ring-slate-200", sizes[size], className)}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_70%_80%,rgba(30,64,175,0.16),transparent_34%)]" />
      <span className="relative">{initials}</span>
      {verified ? (
        <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-white">
          <ShieldCheck size={size === "lg" ? 16 : 12} />
        </span>
      ) : null}
    </span>
  );
}
