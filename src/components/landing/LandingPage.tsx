import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, ClipboardCheck, FileChartColumn, FileText, Lightbulb, MessageSquareLock, Search, ShieldCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

const founderFeatures = [
  { title: "Idea Workspace", text: "Complete one structured Startup Template while keeping your original writing under your control.", icon: Lightbulb },
  { title: "Opportunities", text: "Find pilot incubation programmes and hackathons with clear eligibility and registration routes.", icon: Search },
  { title: "VC Readiness Report", text: "Generate one educational basic readiness report from a completed startup document.", icon: FileChartColumn },
  { title: "Messages", text: "Reply in a private conversation only after an incubator marks Interested or requests information.", icon: MessageSquareLock }
];

const pilotSteps = [
  ["Structure the startup", "Document the problem, solution, customer, evidence, team, funding need, and risks."],
  ["Choose an opportunity", "Apply with the Startup Template for incubation or use the organiser registration route for a hackathon."],
  ["Improve the application", "Run the Application Quality Check, correct specific issues, and submit only when ready for human review."],
  ["Receive a human response", "Track the decision and use messaging only after authorised incubation interest."]
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <PublicHeader />

      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.22),transparent_38%)]" />
        <div className="mx-auto grid min-h-[580px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-2xl">
            <Badge className="border-blue-300/40 bg-blue-500/15 text-blue-100">
              <ShieldCheck aria-hidden="true" size={13} />PACE one-month pilot
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Prepare the startup before the opportunity arrives.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Venture Connect gives students one calm workflow for structured startup documentation, application-quality improvement, incubation review, and practical hackathon registration.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register"><Button size="lg">Create Founder / Student account<ArrowRight aria-hidden="true" size={17} /></Button></Link>
              <Link href="/auth/register?intent=institution"><Button size="lg" variant="secondary">Continue as Organisation</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              {["One Startup Template", "Human incubation decisions", "Permission-based messages"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={15} className="text-emerald-400" />{item}</span>)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Founder pilot workspace</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {founderFeatures.map(({ title, text, icon: Icon }) => <div key={title} className="rounded-xl border border-white/10 bg-slate-900/80 p-4"><Icon aria-hidden="true" size={19} className="text-blue-300" /><h2 className="mt-3 text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-primary">Pilot workflow</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">A clear route from student idea to institution review.</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-4">
            {pilotSteps.map(([title, text], index) => <li key={title} className="bg-white p-5 sm:p-6"><span className="text-sm font-semibold text-primary">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></li>)}
          </ol>
        </div>
      </section>

      <section id="founder-features" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl"><p className="text-sm font-semibold text-primary">Exactly four founder features</p><h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Enough structure to test the pilot, without product clutter.</h2></div>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {founderFeatures.map(({ title, text, icon: Icon }) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary"><Icon aria-hidden="true" size={20} /></span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="opportunities" className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <article className="rounded-xl border border-white/10 p-6 sm:p-8"><ClipboardCheck aria-hidden="true" size={24} className="text-blue-300" /><h2 className="mt-5 text-2xl font-semibold">Incubation Programs</h2><p className="mt-3 text-sm leading-6 text-slate-300">Apply with an opportunity-specific copy of the Startup Template, answer incubator questions, pass the Application Quality Check, and create an immutable submission snapshot.</p></article>
          <article className="rounded-xl border border-white/10 p-6 sm:p-8"><Trophy aria-hidden="true" size={24} className="text-amber-300" /><h2 className="mt-5 text-2xl font-semibold">Hackathons</h2><p className="mt-3 text-sm leading-6 text-slate-300">Use the organiser’s internal registration form or continue to the clearly identified official website. Hackathons never require Idea Workspace or the quality check.</p></article>
        </div>
      </section>

      <section id="organisations" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-20">
          <div><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Building2 aria-hidden="true" size={22} /></span><p className="mt-5 text-sm font-semibold text-emerald-700">For pilot organisations</p><h2 className="mt-3 text-3xl font-semibold leading-tight">Publish practical programmes and review original founder submissions.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Incubators publish programmes and review only applications submitted to their organisation.", "Hackathon organisers publish events and manage internal or official-site registrations.", "The founder’s submitted answers remain unchanged and visible to the authorised reviewer.", "Messaging opens only after Interested or Request Information in the incubation workflow."].map((text) => <p key={text} className="flex gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700"><CheckCircle2 aria-hidden="true" size={18} className="mt-1 shrink-0 text-emerald-600" />{text}</p>)}
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-14 text-white sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center"><FileText aria-hidden="true" size={24} className="text-blue-100" /><h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Start the PACE pilot workflow.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">Create the correct account type and continue into the founder or organisation workspace.</p><Link href="/auth/register" className="mt-7"><Button size="lg" variant="dark">Create account<ArrowRight aria-hidden="true" size={17} /></Button></Link></div>
      </section>

      <PublicFooter />
    </main>
  );
}
