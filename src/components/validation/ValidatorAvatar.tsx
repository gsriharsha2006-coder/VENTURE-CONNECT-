import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ValidatorAvatar({
  name,
  photoUrl,
  verified,
  size = "md",
  className
}: {
  name: string;
  photoUrl?: string;
  verified?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
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
    lg: "h-24 w-24 text-2xl",
    xl: "h-36 w-36 text-3xl"
  };

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 font-bold text-primary shadow-sm ring-1 ring-slate-200", sizes[size], className)}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`${name} validator profile`}
          fill
          sizes={size === "xl" ? "144px" : size === "lg" ? "96px" : size === "md" ? "56px" : "44px"}
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
      {verified ? (
        <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-white">
          <ShieldCheck size={size === "xl" ? 19 : size === "lg" ? 16 : 12} />
        </span>
      ) : null}
    </span>
  );
}
