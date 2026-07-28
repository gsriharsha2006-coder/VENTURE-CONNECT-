import { VentureLogo } from "@/components/brand/VentureLogo";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div role="status" aria-label="Loading Venture Connect" className="mx-auto w-full max-w-4xl">
        <VentureLogo href="" />
        <div className="mt-10 border-b border-slate-200 pb-6">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-5 h-7 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
