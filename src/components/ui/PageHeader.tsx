import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-slate-200 pb-6", className)}>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          {eyebrow ? <p className="text-sm font-semibold text-primary">{eyebrow}</p> : null}
          <h1 className="mt-2 max-w-5xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {description}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
