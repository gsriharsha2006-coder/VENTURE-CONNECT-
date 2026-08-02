"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, LoaderCircle, Mail, UserRound } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordField } from "@/components/auth/PasswordField";
import { companyLabel, roleOptions, type PrimaryAccountType } from "@/components/auth/roleOptions";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { authRedirectTo, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { dashboardForRole, toDatabaseRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

type RegistrationStep = "role" | "details";
type StatusTone = "info" | "success" | "error";
const institutionRoles: Array<{ value: UserRole; label: string }> = [
  { value: "Incubator", label: "Incubator or college programme" },
  { value: "Investor", label: "Investor or venture team" },
  { value: "Hackathon Organizer", label: "Hackathon organiser" },
  { value: "Event Organizer", label: "Startup event organiser" }
];

export default function RegisterPage() {
  const supabaseReady = isSupabaseConfigured();
  const [step, setStep] = useState<RegistrationStep>("role");
  const [primaryRole, setPrimaryRole] = useState<PrimaryAccountType>("Founder");
  const [institutionRole, setInstitutionRole] = useState<UserRole>("Incubator");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(
    supabaseReady
      ? "Choose the account type that matches your work."
      : "Account creation is unavailable until account services are configured."
  );
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const role: UserRole = primaryRole === "Organisation" ? institutionRole : "Founder";
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
      setStatus(error?.message ?? "Your account was created, but its Venture Connect profile is unavailable.");
      setStatusTone("error");
      return;
    }
    window.location.assign(dashboardForRole(profile.role));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseReady || !supabase || !email || !password || submitting) {
      if (!supabaseReady) {
        setStatus("Account creation is unavailable because account services have not been configured.");
        setStatusTone("error");
      }
      return;
    }

    setSubmitting(true);
    setStatus("Creating your account...");
    setStatusTone("info");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: toDatabaseRole(role),
            full_name: fullName.trim(),
            company_name: companyName.trim()
          }
        }
      });

      if (error) {
        setStatus(error.message);
        setStatusTone("error");
      } else if (data.session && data.user) {
        await redirectAuthenticatedUser(data.user.id);
      } else {
        setStatus("Check your inbox to confirm your email address before signing in.");
        setStatusTone("success");
      }
    } catch {
      setStatus("Registration could not be completed. Check your connection and try again.");
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow={`Create account | Step ${step === "role" ? "1" : "2"} of 2`}
      title={step === "role" ? "Choose your Venture Connect role" : "Add your account details"}
      description={step === "role"
        ? "Roles determine the workspace, navigation, and review permissions available after sign-in."
        : `Selected account type: ${role}. You can return to change this selection.`}
    >
      <ol aria-label="Registration progress" className="mb-6 grid grid-cols-2 gap-2 text-xs font-semibold">
        <li aria-current={step === "role" ? "step" : undefined} className={`border-t-2 pt-2 ${step === "role" ? "border-primary text-primary" : "border-emerald-500 text-emerald-700"}`}>1. Account role</li>
        <li aria-current={step === "details" ? "step" : undefined} className={`border-t-2 pt-2 ${step === "details" ? "border-primary text-primary" : "border-slate-200 text-slate-500"}`}>2. Account details</li>
      </ol>

      {step === "role" ? (
        <div>
          <div role="radiogroup" aria-label="Account role" className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const selected = primaryRole === option.role;
              return (
                <button
                  key={option.role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPrimaryRole(option.role)}
                  className={`min-h-40 rounded-lg border p-4 text-left transition-colors ${selected ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon aria-hidden="true" size={19} />
                  </span>
                  <span className="mt-4 block text-sm font-semibold text-slate-950">{option.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-600">{option.description}</span>
                </button>
              );
            })}
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={() => setStep("details")}>
            Continue
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered? <Link href="/auth" className="font-semibold text-primary">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <button type="button" onClick={() => setStep("role")} className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary">
            <ArrowLeft aria-hidden="true" size={15} />
            Change role
          </button>

          {primaryRole === "Organisation" ? (
            <label htmlFor="institution-type" className="mb-5 block">
              <span className="text-sm font-semibold text-slate-700">Organisation type</span>
              <select id="institution-type" value={institutionRole} onChange={(event) => setInstitutionRole(event.target.value as UserRole)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                {institutionRoles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="register-name" className="text-sm font-semibold text-slate-700">Full name</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
                <UserRound aria-hidden="true" size={16} className="text-slate-400" />
                <input id="register-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" className="h-11 w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="register-organisation" className="text-sm font-semibold text-slate-700">{companyLabel(role)}</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
                <Building2 aria-hidden="true" size={16} className="text-slate-400" />
                <input id="register-organisation" value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" className="h-11 w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="register-email" className="text-sm font-semibold text-slate-700">Email address</label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
                <Mail aria-hidden="true" size={16} className="text-slate-400" />
                <input id="register-email" value={email} type="email" required autoComplete="email" onChange={(event) => setEmail(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <PasswordField id="register-password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" hint="Use at least eight characters. A longer unique passphrase is recommended." />
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || !supabaseReady} aria-describedby="registration-status">
            {submitting ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <ArrowRight aria-hidden="true" size={17} />}
            {submitting ? "Creating account..." : "Create account"}
          </Button>
          <div id="registration-status"><StatusMessage tone={statusTone} className="mt-4">{status}</StatusMessage></div>
        </form>
      )}
    </AuthFrame>
  );
}
