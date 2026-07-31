"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("Enter a new password after opening the recovery link from your email.");
  const [saving, setSaving] = useState(false);

  async function updatePassword() {
    if (!isSupabaseConfigured()) {
      setStatus("Password recovery is unavailable because account services are not configured.");
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
    <AuthFrame
      eyebrow="Account recovery"
      title="Set a new password"
      description="Choose a secure password for the Venture Connect account linked to your recovery email."
    >
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="inline-flex rounded-lg bg-blue-50 p-3 text-primary">
          <KeyRound size={22} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Open this page from the time-limited link sent to your account email.</p>

        <div className="mt-6 space-y-4">
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField id="confirm-password" label="Confirm password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" error={confirmation && password !== confirmation ? "Passwords do not match." : undefined} />
        </div>
        <Button className="mt-5 w-full" onClick={updatePassword} disabled={saving || !isSupabaseConfigured()}>
          {saving ? "Updating..." : "Update password"}
        </Button>
        <StatusMessage className="mt-4">{status}</StatusMessage>
        <Link href="/auth" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Return to login <ArrowRight size={15} />
        </Link>
      </div>
    </AuthFrame>
  );
}
