"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { dashboardForRole } from "@/lib/auth/roles";

type StatusTone = "info" | "success" | "error";

export default function SignInPage() {
  const supabaseReady = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(
    supabaseReady
      ? "Use the email and password connected to your Venture Connect account."
      : "Account services are not available in this environment. Public product pages remain accessible."
  );
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  async function redirectAuthenticatedUser(userId: string) {
    if (!supabase) return;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !profile) {
      await supabase.auth.signOut();
      setStatus(error?.message ?? "Your account is missing a Venture Connect profile. Contact the workspace administrator.");
      setStatusTone("error");
      return;
    }

    window.location.assign(dashboardForRole(profile.role));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password || submitting) return;

    setSubmitting(true);
    setStatus("Signing you in...");
    setStatusTone("info");
    try {
      if (!supabase) {
        setStatus("Sign-in is unavailable because account services have not been configured.");
        setStatusTone("error");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message);
        setStatusTone("error");
        return;
      }
      if (data.user) await redirectAuthenticatedUser(data.user.id);
    } catch {
      setStatus("Sign-in could not be completed. Check your connection and try again.");
      setStatusTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Sign in to Venture Connect"
      description="Continue working on your Startup Template, applications, readiness report, and permitted conversations."
    >
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="sign-in-email" className="text-sm font-semibold text-slate-700">Email address</label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
              <Mail aria-hidden="true" size={17} className="text-slate-400" />
              <input
                id="sign-in-email"
                value={email}
                type="email"
                required
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="you@company.com"
              />
            </div>
          </div>
          <PasswordField id="sign-in-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>

        <div className="mt-3 flex justify-end">
          <Link href="/auth/recover" className="text-sm font-semibold text-primary hover:text-primary-deep">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || !supabaseReady} aria-describedby={!supabaseReady ? "sign-in-status" : undefined}>
          {submitting ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <ArrowRight aria-hidden="true" size={17} />}
          {submitting ? "Signing in..." : "Sign in"}
        </Button>

        <div id="sign-in-status"><StatusMessage tone={statusTone} className="mt-4">{status}</StatusMessage></div>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        New to Venture Connect?{" "}
        <Link href="/auth/register" className="font-semibold text-primary hover:text-primary-deep">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}
