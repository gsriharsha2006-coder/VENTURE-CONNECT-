import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Button } from "@/components/ui/Button";

const navigation = [
  { href: "/#workflow", label: "How it works" },
  { href: "/validators", label: "Validators" },
  { href: "/#opportunities", label: "Opportunities" },
  { href: "/pricing", label: "Pricing" }
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <VentureLogo />
        <nav aria-label="Public navigation" className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth" className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-primary sm:block">
            Sign in
          </Link>
          <Link href="/auth/register">
            <Button size="sm">
              <span className="hidden sm:inline">Create account</span>
              <span className="sm:hidden">Join</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
