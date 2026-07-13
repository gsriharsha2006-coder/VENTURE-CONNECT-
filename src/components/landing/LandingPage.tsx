import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileChartColumn,
  Lightbulb,
  LockKeyhole,
  MessageSquareLock,
  ShieldCheck,
  Store,
  UsersRound
} from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { heroMetrics, pricingTiers, workflowSteps } from "@/lib/data";

const roles = [
  ["Founder", "Build startup documents and apply with readiness evidence."],
  ["Investor", "Review structured applications before opening conversations."],
  ["Incubator", "Post programs and compare startup submissions."],
  ["Hackathon Organizer", "Collect high-signal build submissions."],
  ["Event Organizer", "Run competitions and event applications."],
  ["Service Provider", "Offer verified startup services after approval."],
  ["Admin", "Manage users, trust, plans, reports, and approvals."]
];

const modules = [
  { title: "Idea Workspace", icon: Lightbulb, text: "Structured templates turn raw startup ideas into application-ready documents." },
  { title: "VC Readiness Report", icon: FileChartColumn, text: "AI generates reports from selected documents only. No chat assistant inside the workspace." },
  { title: "Interest-gated Messages", icon: MessageSquareLock, text: "Founders cannot message first. Chat unlocks only after reviewer interest and plan access." },
  { title: "Verified Services", icon: Store, text: "Founders discover verified providers, with admin approval and plan-aware pricing." }
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <VentureLogo />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/pricing">Pricing</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/auth">Login</Link>
        </nav>
        <Link href="/auth">
          <Button size="sm">
            Open platform
            <ArrowRight size={15} />
          </Button>
        </Link>
      </header>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit border-blue-300 bg-blue-500/15 text-blue-100">
              <ShieldCheck size={13} />
              VC readiness workflow platform
            </Badge>
            <h1 className="mt-5 max-w-3xl text-[2.75rem] font-semibold leading-[1.04] tracking-normal sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
              Structured discovery, VC readiness, and investor-first communication.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">
              Venture Connect helps founders create investor-ready documents, generate VC Readiness Reports, apply to relevant opportunities, and unlock messaging only after reviewer interest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth">
                <Button size="lg">
                  Create account
                  <ArrowRight size={17} />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  View MVP dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/8 p-4 shadow-premium">
            <div className="rounded-lg bg-white p-4 text-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="text-sm font-semibold">MedLens AI application packet</p>
                  <p className="text-xs text-slate-500">Startup Template complete</p>
                </div>
                <Badge tone="green">88 readiness</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {["Idea Workspace", "VC Readiness Report", "Application"].map((item, index) => (
                  <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">{index + 1}</span>
                      <p className="text-xs font-semibold">{item}</p>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{workflowSteps[index]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <LockKeyhole size={16} />
                  Messaging unlock rule
                </div>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Investor marks Interested, notification is sent, then paid founders can access full chat and meeting links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {heroMetrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <span className="inline-flex rounded-lg bg-blue-50 p-3 text-primary">
                <Icon size={22} />
              </span>
              <h2 className="mt-5 text-lg font-semibold">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.text}</p>
            </div>
          );
        })}
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <Badge>
              <UsersRound size={13} />
              Role-based access
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold">Clear separation for every startup workflow participant.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Each role gets a dashboard suited to the job: founders prepare, reviewers evaluate, providers serve, and admins govern trust.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {roles.map(([role, text]) => (
              <div key={role} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold">{role}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className={`rounded-lg border p-6 shadow-sm ${tier.highlighted ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tier.description}</p>
              <p className="mt-6 text-3xl font-semibold">{tier.price}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {tier.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
