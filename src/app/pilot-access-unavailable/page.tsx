import Link from "next/link";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Button } from "@/components/ui/Button";

export default function PilotAccessUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-5 py-12 text-center">
      <VentureLogo className="mx-auto" />
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-primary">PACE one-month pilot</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">This account role is outside the pilot scope.</h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        The pilot currently supports Founder / Student, Incubator, and Hackathon Organiser accounts. Contact the pilot administrator if your account should use one of these roles.
      </p>
      <Link href="/auth" className="mx-auto mt-7"><Button>Return to sign in</Button></Link>
    </main>
  );
}
