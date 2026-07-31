"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { authRedirectTo, isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function PasswordRecoveryPage() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(
    configured
      ? "Enter the email address used for your Venture Connect account."
      : "Password recovery is unavailable until account services are configured."
  );
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || !supabase || sending) {
      setStatus("Password recovery is unavailable in this environment.");
      setTone("error");
      return;
    }

    setSending(true);
    setStatus("Requesting a recovery email...");
    setTone("info");
    const recoveryRedirect = `${authRedirectTo}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirect });
    setSending(false);
    setStatus(error ? error.message : "If an account matches that address, recovery instructions will be sent shortly.");
    setTone(error ? "error" : "success");
  }

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      description="We will send a time-limited recovery link when authentication is available and the address belongs to an account."
    >
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="recovery-email" className="text-sm font-semibold text-slate-700">Email address</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
          <Mail aria-hidden="true" size={17} className="text-slate-400" />
          <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" />
        </div>
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={!configured || sending} aria-describedby="recovery-status">
          {sending ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : null}
          {sending ? "Sending..." : "Send recovery link"}
        </Button>
        <div id="recovery-status"><StatusMessage tone={tone} className="mt-4">{status}</StatusMessage></div>
        <Link href="/auth" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden="true" size={15} />
          Return to sign in
        </Link>
      </form>
    </AuthFrame>
  );
}
