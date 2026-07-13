"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("Enter a new password after opening the recovery link from your email.");
  const [saving, setSaving] = useState(false);

  async function updatePassword() {
    if (!isSupabaseConfigured()) {
      setStatus("Supabase is not configured. Password recovery is available only in live authentication mode.");
      return;
    }
    if (password.length < 8) {
      setStatus("Use at least 8 characters for the new password.");
      return;
    }
    if (password !== confirmation) {
      setStatus("The password confirmation does not match.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    setStatus("Password updated. Return to login and use the new password.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-premium sm:p-8">
        <VentureLogo />
        <div className="mt-8 inline-flex rounded-lg bg-blue-50 p-3 text-primary">
          <KeyRound size={22} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your recovery session is stored in secure Supabase auth cookies.</p>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">New password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-primary" />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Confirm password</span>
          <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-primary" />
        </label>
        <Button className="mt-5 w-full" onClick={updatePassword} disabled={saving}>
          {saving ? "Updating..." : "Update password"}
        </Button>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">{status}</div>
        <Link href="/auth" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Return to login <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
