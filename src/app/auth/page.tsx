"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  LoaderCircle,
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
import { dashboardForRole, toDatabaseRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

type AuthMode = "login" | "signup";

const roleCards: Array<{ role: UserRole; title: string; description: string }> = [
  { role: "Founder", title: "Founder", description: "Build & submit your startup" },
  { role: "Investor", title: "Investor", description: "Discover quality deal flow" },
  { role: "Incubator", title: "Incubator", description: "Post programs and review startup applications" },
  { role: "Hackathon Organizer", title: "Hackathon Organizer", description: "Post hackathons and manage submissions" },
  { role: "Event Organizer", title: "Event Organizer", description: "Post startup events and competitions" },
  { role: "Service Provider", title: "Service Provider", description: "Offer startup services after verification" },
  { role: "Validator", title: "Validator", description: "Review Idea Workspace documents after approval" }
];

function companyLabel(role: UserRole) {
  if (role === "Founder") return "Startup/Company name (optional)";
  if (role === "Investor") return "Fund/Firm name (optional)";
  if (role === "Incubator") return "Incubator/Institution name";
  if (role === "Hackathon Organizer" || role === "Event Organizer") return "Organization name";
  if (role === "Service Provider") return "Firm/Company name";
  if (role === "Validator") return "Institution or company name";
  return "Company name";
}

export default function AuthPage() {
  const supabaseReady = isSupabaseConfigured();
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
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(
    supabaseReady
      ? "Live Supabase authentication is ready."
      : "Development/demo mode is active. Authentication is not persisted."
  );

  const redirectTo = useMemo(
    () => `${authRedirectTo}/auth/callback?next=${encodeURIComponent(dashboardForRole(role))}`,
    [role]
  );

  async function redirectAuthenticatedUser(userId: string) {
    if (!supabase) return;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !profile) {
      await supabase.auth.signOut();
      setStatus(error?.message ?? "Your account is missing a Venture Connect profile. Run the production schema and try again.");
      return;
    }
    window.location.assign(dashboardForRole(profile.role));
  }

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!email || !password) {
      setStatus("Enter email and password to continue.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setStatus(mode === "signup" ? "Creating your account..." : "Signing you in...");
    try {
      if (!supabase) {
        setStatus(`${mode === "signup" ? "Signup" : "Login"} ready for ${email} as ${role}. Configure Supabase to persist accounts.`);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              role: toDatabaseRole(role),
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
        if (error) {
          setStatus(error.message);
          return;
        }
        if (data.session && data.user) {
          await redirectAuthenticatedUser(data.user.id);
          return;
        }
        setStatus(`Signup started for ${email}. Check your inbox to confirm the account.`);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message);
        return;
      }
      if (data.user) await redirectAuthenticatedUser(data.user.id);
    } catch {
      setStatus("Authentication could not be completed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setStatus("Enter your email address, then request a password reset.");
      return;
    }
    if (!supabase) {
      setStatus("Configure Supabase before testing password recovery.");
      return;
    }
    const recoveryRedirect = `${authRedirectTo}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirect });
    setStatus(error ? error.message : `Password recovery instructions were sent to ${email}.`);
  }

  return (
    <main className="min-h-dvh bg-slate-50 lg:h-dvh lg:overflow-hidden">
      <div className="grid min-h-dvh lg:h-dvh lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-5 text-white sm:p-6 lg:h-dvh lg:p-10 xl:p-12">
          <div className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <VentureLogo invert />
          <div className="relative hidden max-w-xl py-6 lg:block">
            <Badge className="border-blue-300 bg-blue-500/15 text-blue-100">
              <ShieldCheck size={13} />
              Role-based authentication
            </Badge>
            <h1 className="text-balance mt-6 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
              The professional network for startup fundraising.
            </h1>
            <p className="mt-5 text-base leading-7 text-blue-100">
              Structured discovery, VC readiness, and investor-first communication—all in one platform.
            </p>
          </div>
          <div className="hidden gap-3 text-sm text-blue-100 sm:grid-cols-3 lg:grid">
            {["No public random chat", "No generic social feed", "Messages after interest"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-3">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex px-4 py-6 sm:px-6 lg:h-dvh lg:overflow-y-auto lg:px-10 lg:py-8 xl:px-12">
          <div className="mx-auto my-auto w-full max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge tone={supabaseReady ? "green" : "amber"}>
                  {supabaseReady ? "Supabase connected" : "Prototype auth"}
                </Badge>
                <h2 className="mt-4 text-3xl font-semibold">{mode === "signup" ? "Create account" : "Login"}</h2>
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {(["signup", "login"] as AuthMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${mode === item ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {mode === "signup" ? (
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                {roleCards.map((card) => (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setRole(card.role)}
                    aria-pressed={role === card.role}
                    className={`rounded-xl border bg-white p-3 text-left transition duration-200 ${role === card.role ? "border-blue-400 bg-blue-50/50 shadow-sm ring-4 ring-blue-100" : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <UserRound size={17} className="text-primary" />
                      {card.title}
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{card.description}</p>
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] sm:p-6">
              {mode === "signup" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">{role === "Service Provider" ? "Name" : "Full name"}</span>
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="Nisha Rao" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">{companyLabel(role)}</span>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
                      <Building2 size={16} className="text-slate-400" />
                      <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Company, firm, fund, or institution" />
                    </div>
                  </label>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail size={16} className="text-slate-400" />
                    <input value={email} type="email" required autoComplete="email" onChange={(event) => setEmail(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="founder@company.com" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  <input value={password} type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="Minimum 8 characters" />
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

              <Button type="submit" disabled={submitting} className="mt-5 h-12 w-full">
                {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                {submitting ? (mode === "signup" ? "Creating account..." : "Signing in...") : mode === "signup" ? "Create account" : "Login"}
              </Button>
              {mode === "login" && supabaseReady ? (
                <button type="button" onClick={handlePasswordReset} className="mt-3 text-sm font-semibold text-primary">
                  Forgot password?
                </button>
              ) : null}
              <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">{status}</div>
              {!supabaseReady ? (
                <div className="mt-4 flex flex-col gap-1">
                  <Link href={dashboardForRole(role)} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Continue in prototype mode
                    <ArrowRight size={16} />
                  </Link>
                  <p className="text-xs leading-5 text-slate-500">Add Supabase env vars for live authentication.</p>
                </div>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
