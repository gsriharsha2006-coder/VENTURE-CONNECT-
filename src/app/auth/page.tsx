"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  UserRound
} from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { authRedirectTo, isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";

type AuthMode = "login" | "signup";

const roleCards: Array<{ role: UserRole; title: string; description: string }> = [
  { role: "Founder", title: "Founder", description: "Build & submit your startup" },
  { role: "Investor", title: "Investor", description: "Discover quality deal flow" },
  { role: "Incubator", title: "Incubator", description: "Post programs and review startup applications" },
  { role: "Hackathon Organizer", title: "Hackathon Organizer", description: "Post hackathons and manage submissions" },
  { role: "Event Organizer", title: "Event Organizer", description: "Post startup events and competitions" },
  { role: "Service Provider", title: "Service Provider", description: "Offer startup services after verification" }
];

function dashboardForRole(role: UserRole) {
  if (role === "Investor" || role === "Incubator" || role === "Hackathon Organizer" || role === "Event Organizer") return "/investor/discover";
  if (role === "Service Provider") return "/provider/dashboard";
  if (role === "Admin") return "/admin";
  return "/dashboard";
}

function companyLabel(role: UserRole) {
  if (role === "Founder") return "Startup/Company name (optional)";
  if (role === "Investor") return "Fund/Firm name (optional)";
  if (role === "Incubator") return "Incubator/Institution name";
  if (role === "Hackathon Organizer" || role === "Event Organizer") return "Organization name";
  if (role === "Service Provider") return "Firm/Company name";
  return "Company name";
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [role, setRole] = useState<UserRole>("Founder");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Patent filing");
  const [panOrGst, setPanOrGst] = useState("");
  const [website, setWebsite] = useState("");
  const [experience, setExperience] = useState("");
  const [cgpdtm, setCgpdtm] = useState("");
  const [status, setStatus] = useState("Prototype mode: add Supabase env vars for live authentication.");
  const supabaseReady = isSupabaseConfigured();

  const redirectTo = useMemo(() => `${authRedirectTo}${dashboardForRole(role)}`, [role]);

  async function handleSubmit() {
    if (!email || !password) {
      setStatus("Enter email and password to continue.");
      return;
    }

    if (!supabase) {
      setStatus(`${mode === "signup" ? "Signup" : "Login"} ready for ${email} as ${role}. Configure Supabase to persist accounts.`);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role,
            full_name: fullName || email.split("@")[0],
            company_name: companyName,
            phone,
            service_category: role === "Service Provider" ? serviceCategory : undefined,
            pan_or_gst: role === "Service Provider" ? panOrGst : undefined,
            website_or_linkedin: role === "Service Provider" ? website : undefined,
            experience_details: role === "Service Provider" ? experience : undefined,
            cgpdtm_registration_number: role === "Service Provider" ? cgpdtm : undefined
          }
        }
      });
      setStatus(error ? error.message : `Signup started for ${email}. Check your inbox.`);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
    else window.location.href = dashboardForRole(role);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between bg-slate-950 p-8 text-white lg:p-12">
          <VentureLogo invert />
          <div className="max-w-xl py-12">
            <Badge className="border-blue-300 bg-blue-500/15 text-blue-100">
              <ShieldCheck size={13} />
              Role-based authentication
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-normal">
              The professional network for startup fundraising.
            </h1>
            <p className="mt-5 text-base leading-7 text-blue-100">
              Structured discovery, AI-validated readiness, and investor-first communication -- all in one platform.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-blue-100 sm:grid-cols-3">
            {["No public random chat", "No generic social feed", "Messages after interest"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-3">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-4 py-8 sm:px-6 lg:px-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <Badge tone={supabaseReady ? "green" : "amber"}>
                  {supabaseReady ? "Supabase connected" : "Prototype auth"}
                </Badge>
                <h2 className="mt-4 text-3xl font-semibold">{mode === "signup" ? "Create account" : "Login"}</h2>
              </div>
              <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
                {(["signup", "login"] as AuthMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${mode === item ? "bg-primary text-white" : "text-slate-500"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {mode === "signup" ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setRole(card.role)}
                    className={`rounded-lg border bg-white p-4 text-left transition ${role === card.role ? "border-blue-300 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <UserRound size={17} className="text-primary" />
                      {card.title}
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{card.description}</p>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {mode === "signup" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">{role === "Service Provider" ? "Name" : "Full name"}</span>
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder="Nisha Rao" />
                  </label>
                  <label className="mt-4 block">
                    <span className="text-sm font-semibold text-slate-700">{companyLabel(role)}</span>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                      <Building2 size={16} className="text-slate-400" />
                      <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Company, firm, fund, or institution" />
                    </div>
                  </label>
                </>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                    <Mail size={16} className="text-slate-400" />
                    <input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="founder@company.com" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder="Minimum 8 characters" />
                </label>
              </div>

              {mode === "signup" && role === "Service Provider" ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Phone number</span>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                      <Phone size={16} className="text-slate-400" />
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="+91 90000 10000" />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Service category</span>
                    <select value={serviceCategory} onChange={(event) => setServiceCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none">
                      {["Patent filing", "Trademark registration", "Company registration", "GST/tax filing", "ROC compliance", "Legal documentation", "Pitch deck design", "Financial modeling", "Startup compliance", "Product development", "Marketing services"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">PAN or GST</span>
                    <input value={panOrGst} onChange={(event) => setPanOrGst(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Business website or LinkedIn profile</span>
                    <input value={website} onChange={(event) => setWebsite(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
                  </label>
                  <label className="md:col-span-2 block">
                    <span className="text-sm font-semibold text-slate-700">Experience details</span>
                    <textarea value={experience} onChange={(event) => setExperience(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">License/certificate upload</span>
                    <span className="mt-2 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-500">
                      <Upload size={16} />
                      Choose file
                      <input type="file" className="hidden" />
                    </span>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">CGPDTM Patent Agent Registration Number</span>
                    <input value={cgpdtm} onChange={(event) => setCgpdtm(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" placeholder="For patent providers" />
                  </label>
                </div>
              ) : null}

              <Button className="mt-5 h-12 w-full" onClick={handleSubmit}>
                {mode === "signup" ? "Create account" : "Login"}
                <ArrowRight size={17} />
              </Button>
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">{status}</div>
              <Link href={dashboardForRole(role)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Continue in prototype mode
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
