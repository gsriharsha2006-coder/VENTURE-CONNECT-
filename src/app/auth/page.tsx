"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { authRedirectTo, isSupabaseConfigured, supabase } from "@/lib/supabase";
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
      : "Prototype authentication is active. Use the demo link below to inspect the founder workflow."
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
        setStatus("Live authentication is not configured in this environment. Continue with the founder demo below.");
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

  async function handlePasswordReset() {
    if (!email) {
      setStatus("Enter your email address before requesting a password reset.");
      setStatusTone("error");
      return;
    }
    if (!supabase) {
      setStatus("Password recovery is available when Supabase authentication is configured.");
      setStatusTone("info");
      return;
    }

    const recoveryRedirect = `${authRedirectTo}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirect });
    setStatus(error ? error.message : `Password recovery instructions were sent to ${email}.`);
    setStatusTone(error ? "error" : "success");
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Sign in to Venture Connect"
      description="Continue working on startup documents, validation requests, applications, and conversations."
    >
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email address</span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
              <Mail aria-hidden="true" size={17} className="text-slate-400" />
              <input
                value={email}
                type="email"
                required
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="you@company.com"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
              <LockKeyhole aria-hidden="true" size={17} className="text-slate-400" />
              <input
                value={password}
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full bg-transparent text-sm outline-none"
                placeholder="Enter your password"
              />
            </div>
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={handlePasswordReset} className="text-sm font-semibold text-primary hover:text-primary-deep">
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
          {submitting ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <ArrowRight aria-hidden="true" size={17} />}
          {submitting ? "Signing in..." : "Sign in"}
        </Button>

        <StatusMessage tone={statusTone} className="mt-4">{status}</StatusMessage>

        {!supabaseReady ? (
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Continue with founder demo
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        ) : null}
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
