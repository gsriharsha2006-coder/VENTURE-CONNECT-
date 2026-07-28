import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("premium-card rounded-lg p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow ? (
          <p className="mb-1 text-sm font-medium text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
