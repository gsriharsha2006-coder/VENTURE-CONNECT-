import Link from "next/link";
import { VentureLogo } from "@/components/brand/VentureLogo";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <VentureLogo />
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
          <Link href="/#workflow" className="hover:text-primary">Workflow</Link>
          <Link href="/#validation" className="hover:text-primary">Human validation</Link>
          <Link href="/pricing" className="hover:text-primary">Pricing</Link>
          <Link href="/faq" className="hover:text-primary">FAQ</Link>
        </nav>
        <p className="text-xs text-slate-500">Built for founders, validators, incubators, and investors.</p>
      </div>
    </footer>
  );
}
