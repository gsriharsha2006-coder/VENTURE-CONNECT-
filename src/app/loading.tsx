import { VentureLogo } from "@/components/brand/VentureLogo";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center shadow-premium">
        <VentureLogo href="" invert />
        <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse-line rounded-full bg-blue-400" />
        </div>
      </div>
    </main>
  );
}
