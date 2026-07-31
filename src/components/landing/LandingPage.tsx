import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lightbulb,
  MessageSquareLock,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PRICING_TIERS } from "@/lib/subscription/plans";

const journey = [
  { title: "Discover a problem", text: "Capture the people affected, the current workaround, and the evidence you already have.", icon: Search },
  { title: "Structure the idea", text: "Turn early notes into a clear Idea Workspace document.", icon: Lightbulb },
  { title: "Validate assumptions", text: "Request human review when approved validators are available.", icon: UserCheck },
  { title: "Prepare the application", text: "Improve the document and attach the required evidence.", icon: FileText },
  { title: "Apply to a programme", text: "Use the correct Venture Connect or official organiser application route.", icon: ClipboardCheck },
  { title: "Receive feedback", text: "Track review status and message only after authorised interest.", icon: MessageSquareLock }
];

const founderBenefits = [
  "A guided document instead of an empty pitch template",
  "Human feedback tied to evidence and a specific version",
  "Relevant programs without scattered opportunity hunting",
  "A clear application trail from submission to response"
];

const ecosystemBenefits = [
  "Structured applications that are easier to compare",
  "Human-reviewed indicators with traceable verification",
  "Less back-and-forth before an initial review",
  "Controlled messaging that protects both sides"
];

const servicePreview = [
  { name: "Written review", detail: "Structured comments tied to one document version." },
  { name: "Live validation", detail: "A scheduled review conversation with written next steps." },
  { name: "Structured report", detail: "Evidence, risks, assumptions, and required improvements." }
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicHeader />

      <section
        className="relative isolate flex min-h-[620px] overflow-hidden bg-slate-950 bg-cover bg-center text-white sm:min-h-[680px]"
        style={{ backgroundImage: "url('/images/landing/founder-workflow.webp')" }}
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.88)_38%,rgba(2,6,23,0.42)_67%,rgba(2,6,23,0.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.52))]" />
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="border-blue-300/40 bg-blue-500/15 text-blue-100">
              <ShieldCheck aria-hidden="true" size={13} />
              Startup document and validation workflow
            </Badge>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Venture Connect
            </h1>
            <p className="mt-5 max-w-xl text-xl font-medium leading-8 text-white sm:text-2xl">
              From an early idea to an opportunity-ready startup.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Venture Connect helps emerging founders structure ideas, validate assumptions, prepare stronger applications and discover relevant startup programmes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register">
                <Button size="lg">
                  Start an Idea Workspace
                  <ArrowRight aria-hidden="true" size={17} />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Explore opportunities
                </Button>
              </Link>
              <Link href="/auth/register?intent=institution" className="inline-flex min-h-12 items-center text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                Partner as an institution
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              {["No public idea feed", "No founder-to-investor spam", "No crowdfunding"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" size={15} className="text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">One connected founder journey</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              A practical path from problem discovery to review.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Each stage carries the same structured document forward, so feedback, revisions, applications, and conversations keep their context.
            </p>
          </div>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-3">
            {journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                <Lightbulb aria-hidden="true" size={20} />
              </span>
              <p className="text-sm font-semibold text-primary">For founders</p>
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Know what to improve before an application is judged.</h2>
            <div className="mt-7 space-y-4">
              {founderBenefits.map((benefit) => (
                <p key={benefit} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  {benefit}
                </p>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Building2 aria-hidden="true" size={20} />
              </span>
              <p className="text-sm font-semibold text-emerald-700">For validators and incubation teams</p>
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Review better-prepared founders with less administrative noise.</h2>
            <div className="mt-7 space-y-4">
              {ecosystemBenefits.map((benefit) => (
                <p key={benefit} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  {benefit}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="validation" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">Validation Hub</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                Human review that is tied to the work.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Approved profiles show expertise, format, availability, price, and verification state. When no reviewers are available, the directory says so rather than displaying synthetic profiles.
              </p>
              <Link href="/validators" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View validator availability
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {servicePreview.map((service) => (
                <div key={service.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-primary">{service.name}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{service.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <Badge className="border-blue-300/30 bg-blue-500/15 text-blue-100">
              <Search aria-hidden="true" size={13} />
              Opportunity discovery
            </Badge>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
              Find programs that match the startup you have actually documented.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Discover incubators, accelerators, hackathons, grants, competitions, and investor opportunities. Venture Connect separates internal applications from official external registrations and tracks both.
            </p>
          </div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {[
              ["Match", "Filter by domain, stage, mode, geography, and deadline."],
              ["Apply", "Use an Idea Workspace where the program accepts Venture Connect submissions."],
              ["Track", "Keep official external registrations beside platform applications."]
            ].map(([title, text]) => (
              <div key={title} className="grid grid-cols-[88px_1fr] gap-4 py-5">
                <p className="font-semibold text-blue-300">{title}</p>
                <p className="text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Human validation and AI assistance</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Different jobs, clearly separated.</h2>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-2">
            <div className="bg-white p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-primary">
                <Bot aria-hidden="true" size={22} />
              </span>
              <h3 className="mt-5 text-xl font-semibold">AI helps you think and refine</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use AI for report drafts, market framing, SWOT analysis, missing-section prompts, and pitch improvement. AI output remains assistance, not independent verification.
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <UsersRound aria-hidden="true" size={22} />
              </span>
              <h3 className="mt-5 text-xl font-semibold">Human experts review evidence and readiness</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Administrator-approved validators examine the selected document, justify dimension scores, identify risks, and issue review badges only when the report supports them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">Founder plans</p>
              <h2 className="mt-3 text-3xl font-semibold">Start free. Upgrade when the workflow earns it.</h2>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Compare all plan details
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {[
              { name: "Free", price: "₹0", description: "One workspace, one monthly application, and a basic readiness report.", highlighted: false },
              ...PRICING_TIERS.map((tier) => ({ name: tier.name, price: tier.price.replace("Rs", "₹"), description: tier.description, highlighted: tier.highlighted }))
            ].map((tier) => (
              <div key={tier.name} className={`rounded-lg border p-6 ${tier.highlighted ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                {tier.highlighted ? <Badge className="mb-4">Best for active founders</Badge> : null}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-4 text-3xl font-semibold">{tier.price}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-14 text-white sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Sparkles aria-hidden="true" size={24} className="text-blue-100" />
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Give the idea a professional place to grow.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">
            Create a founder account, start the Idea Workspace, and build the evidence before the application deadline arrives.
          </p>
          <Link href="/auth/register" className="mt-7">
            <Button size="lg" variant="dark">
              Register for Venture Connect
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
