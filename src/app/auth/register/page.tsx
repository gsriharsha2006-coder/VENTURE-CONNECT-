"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  LoaderCircle,
  Mail,
  Phone,
  Upload,
  UserRound
} from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { companyLabel, roleOptions } from "@/components/auth/roleOptions";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { authRedirectTo, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { dashboardForRole, toDatabaseRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

type RegistrationStep = "role" | "details";
type StatusTone = "info" | "success" | "error";

export default function RegisterPage() {
  const supabaseReady = isSupabaseConfigured();
  const [step, setStep] = useState<RegistrationStep>("role");
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
  const [status, setStatus] = useState("Choose the role that matches how you will use Venture Connect.");
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

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

  function continueToDetails() {
    setStep("details");
    setStatus(`Create the account details for your ${role.toLowerCase()} workspace.`);
    setStatusTone("info");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password || submitting) return;

    setSubmitting(true);
    setStatus("Creating your account...");
    setStatusTone("info");
    try {
      if (!supabase) {
        setStatus(`Prototype registration is ready for ${email} as ${role}. Live persistence requires Supabase.`);
        setStatusTone("success");
        return;
      }

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
        setStatusTone("error");
        return;
      }
      if (data.session && data.user) {
        await redirectAuthenticatedUser(data.user.id);
        return;
      }
      setStatus(`Account created for ${email}. Check your inbox to confirm your email address.`);
      setStatusTone("success");
    } catch {
      setStatus("Registration could not be completed. Check your connection and try again.");
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow={`Create account · Step ${step === "role" ? "1" : "2"} of 2`}
      title={step === "role" ? "How will you use Venture Connect?" : `Set up your ${role.toLowerCase()} account`}
      description={step === "role"
        ? "Your role controls navigation, permissions, and the workflows available after sign-in."
        : "Use professional details so founders and ecosystem partners can understand who they are working with."}
    >
      {step === "role" ? (
        <div>
          <div role="radiogroup" aria-label="Account role" className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const selected = role === option.role;
              return (
                <button
                  key={option.role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(option.role)}
                  className={`min-h-28 rounded-lg border bg-white p-4 text-left transition-colors ${selected ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-slate-950">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{option.description}</span>
                </button>
              );
            })}
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={continueToDetails}>
            Continue as {role}
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered? <Link href="/auth" className="font-semibold text-primary">Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <button type="button" onClick={() => setStep("role")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary">
            <ArrowLeft aria-hidden="true" size={15} />
            Change role
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full name</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <UserRound aria-hidden="true" size={16} className="text-slate-400" />
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Nisha Rao" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">{companyLabel(role)}</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Building2 aria-hidden="true" size={16} className="text-slate-400" />
                <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} autoComplete="organization" className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Organization name" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email address</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Mail aria-hidden="true" size={16} className="text-slate-400" />
                <input value={email} type="email" required autoComplete="email" onChange={(event) => setEmail(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="you@company.com" />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input value={password} type="password" required minLength={8} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" placeholder="At least 8 characters" />
            </label>
          </div>

          {role === "Service Provider" ? (
            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Phone number</span>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                  <Phone aria-hidden="true" size={16} className="text-slate-400" />
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
                <span className="text-sm font-semibold text-slate-700">Website or LinkedIn</span>
                <input value={website} onChange={(event) => setWebsite(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Experience details</span>
                <textarea value={experience} onChange={(event) => setExperience(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">License or certificate</span>
                <span className="mt-2 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-500">
                  <Upload aria-hidden="true" size={16} />
                  Choose file
                  <input type="file" className="hidden" />
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">CGPDTM registration number</span>
                <input value={cgpdtm} onChange={(event) => setCgpdtm(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" placeholder="For patent providers" />
              </label>
            </div>
          ) : null}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <ArrowRight aria-hidden="true" size={17} />}
            {submitting ? "Creating account..." : "Create account"}
          </Button>
          <StatusMessage tone={statusTone} className="mt-4">{status}</StatusMessage>
          {!supabaseReady ? (
            <Link href={dashboardForRole(role)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Continue in prototype mode
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          ) : null}
        </form>
      )}
    </AuthFrame>
  );
}
