import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileCheck2, Send, ShieldCheck } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";

const journey = [
  { icon: FileCheck2, label: "Build a structured startup document" },
  { icon: ShieldCheck, label: "Validate it with a human expert" },
  { icon: Send, label: "Apply with stronger evidence" }
];

export function AuthFrame({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-slate-50">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(340px,0.78fr)_minmax(620px,1.22fr)]">
        <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-9 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative">
            <VentureLogo invert />
          </div>
          <div className="relative my-auto max-w-lg py-10">
            <p className="text-sm font-semibold text-blue-300">Founder operating workflow</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Move from an idea to a credible application.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Venture Connect keeps documents, human validation, opportunities, applications, and interest-gated messaging in one professional system.
            </p>
            <div className="mt-9 space-y-3">
              {journey.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm font-medium text-slate-200">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="relative flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 aria-hidden="true" size={14} className="text-emerald-400" />
            Confidential documents stay inside controlled workflows.
          </p>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-10">
            <div className="lg:hidden">
              <VentureLogo />
            </div>
            <Link href="/" className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft aria-hidden="true" size={15} />
              Back to Venture Connect
            </Link>
          </header>
          <div className="flex flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-2xl">
              <p className="text-sm font-semibold text-primary">{eyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
              <div className="mt-7">{children}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
