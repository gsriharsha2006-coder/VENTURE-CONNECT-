"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileChartColumn,
  FileText,
  FilePlus2,
  Home,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MessagesSquare,
  Search,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Store,
  UserCheck,
  UserRound,
  UsersRound,
  Wallet,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { toDatabaseRole } from "@/lib/auth/roles";

type NavItem = { href: string; label: string; icon: LucideIcon };

const founderNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/idea-workspace", label: "Idea Workspace", icon: Lightbulb },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Compass },
  { href: "/dashboard/validation-hub", label: "Validation Hub", icon: ShieldCheck },
  { href: "/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/dashboard/messages", label: "Messages", icon: MessagesSquare },
  { href: "/dashboard/vc-readiness", label: "VC Readiness Report", icon: FileChartColumn },
  { href: "/blogs", label: "Founder Blog", icon: FileText }
];

const investorNav: NavItem[] = [
  { href: "/investor/discover", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investor/post-opportunity", label: "Opportunities", icon: FilePlus2 },
  { href: "/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/investor/interested", label: "Interested Founders", icon: UserCheck },
  { href: "/investor/messages", label: "Messages", icon: MessagesSquare },
  { href: "/investor/saved", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/blogs", label: "Ecosystem Blog", icon: FileText }
];

const providerNav: NavItem[] = [
  { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/verification", label: "Verification", icon: ShieldCheck },
  { href: "/provider/services", label: "Services", icon: Store },
  { href: "/provider/requests", label: "Requests", icon: Inbox },
  { href: "/provider/profile", label: "Profile", icon: UserRound }
];

const validatorNav: NavItem[] = [
  { href: "/validator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/validator/requests", label: "Requests", icon: Inbox },
  { href: "/validator/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/validator/reports", label: "Reports", icon: FileText },
  { href: "/validator/messages", label: "Messages", icon: MessagesSquare },
  { href: "/validator/earnings", label: "Earnings", icon: Wallet },
  { href: "/validator/profile", label: "Profile", icon: UserRound }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/validators", label: "Validators", icon: ShieldCheck },
  { href: "/admin/opportunities", label: "Opportunities", icon: Compass },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/reports", label: "Reports", icon: FileChartColumn },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/disputes", label: "Disputes", icon: TriangleAlert },
  { href: "/admin/settings", label: "Settings", icon: Settings2 }
];

function navigationFor(role: string) {
  const databaseRole = toDatabaseRole(role);
  if (["investor", "incubator", "hackathon_organizer", "event_organizer"].includes(databaseRole)) {
    return { label: databaseRole === "investor" ? "Investor" : "Institution / organiser", items: investorNav, kind: "institution" as const };
  }
  if (databaseRole === "service_provider") return { label: "Service provider", items: providerNav, kind: "provider" as const };
  if (databaseRole === "validator") return { label: "Validator", items: validatorNav, kind: "validator" as const };
  if (databaseRole === "admin") return { label: "Admin", items: adminNav, kind: "admin" as const };
  return { label: "Founder", items: founderNav, kind: "founder" as const };
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, role }: { children: React.ReactNode; role: string }) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigation = navigationFor(role);
  const currentItem = [...navigation.items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href)) ?? navigation.items[0];
  const isInvestor = navigation.kind === "institution";
  const isProvider = navigation.kind === "provider";
  const isValidator = navigation.kind === "validator";
  const isAdmin = navigation.kind === "admin";
  const notificationsHref = isInvestor ? "/investor/notifications" : isValidator ? "/validator/messages" : "/dashboard/messages";
  const messagesHref = isInvestor ? "/investor/messages" : isValidator ? "/validator/messages" : "/dashboard/messages";
  const discoveryHref = isInvestor
    ? "/investor/discover"
    : isProvider
      ? "/provider/services"
      : isValidator
        ? "/validator/requests"
      : isAdmin
        ? "/admin/users"
        : "/dashboard/opportunities";
  const primaryHref = isInvestor
    ? "/investor/post-opportunity"
    : isProvider
      ? "/provider/services"
      : isValidator
        ? "/validator/requests"
      : isAdmin
        ? "/admin/validators"
        : "/dashboard/idea-workspace";
  const primaryLabel = isInvestor ? "Post opportunity" : isProvider ? "Manage services" : isValidator ? "Review requests" : isAdmin ? "Review validators" : "New document";
  const PrimaryIcon = isInvestor ? FilePlus2 : isProvider ? Store : isValidator ? Inbox : isAdmin ? ShieldCheck : Lightbulb;

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavigationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      menuButton?.focus();
    };
  }, [mobileNavigationOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      window.location.assign("/auth");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      window.alert(`Unable to log out: ${error.message}`);
      return;
    }
    window.location.assign("/auth");
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <aside className="scrollbar-thin fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:flex">
        <VentureLogo className="px-2" />

        <div className="mt-7 flex items-center gap-2 border-y border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">
          <ShieldCheck aria-hidden="true" size={16} className="text-primary" />
          {navigation.label}
        </div>

        <nav className="mt-4" aria-label={`${navigation.label} navigation`}>
          <div className="space-y-1">
            {navigation.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                    active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {mobileNavigationOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 bg-slate-950/35"
            onClick={() => setMobileNavigationOpen(false)}
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={`${navigation.label} navigation`}
            className="scrollbar-thin relative flex h-dvh w-[min(88vw,320px)] flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <VentureLogo />
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileNavigationOpen(false)}
                className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition-colors hover:bg-slate-100"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <p className="mt-7 px-3 text-sm font-semibold text-slate-500">{navigation.label}</p>
            <nav className="mt-2 space-y-1">
              {navigation.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavigationOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                      active ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Icon aria-hidden="true" size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link href={primaryHref} onClick={() => setMobileNavigationOpen(false)} className="mt-auto pt-6">
              <Button className="w-full">
                <PrimaryIcon aria-hidden="true" size={16} />
                {primaryLabel}
              </Button>
            </Link>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Open navigation"
                aria-expanded={mobileNavigationOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMobileNavigationOpen(true)}
                className="rounded-lg border border-slate-200 p-2.5 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
              >
                <Menu aria-hidden="true" size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{currentItem.label}</p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">{navigation.label} workspace</p>
              </div>
              <Link
                href={discoveryHref}
                aria-label={`Open ${navigation.label.toLowerCase()} discovery`}
                className="ml-3 hidden w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-slate-700 xl:flex"
              >
                <Search size={17} className="shrink-0 text-slate-400" />
                <span className="truncate text-sm">Find {isProvider ? "services" : isValidator ? "requests" : isAdmin ? "users" : "opportunities"}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href={primaryHref} className="hidden lg:block">
                <Button variant="secondary" size="sm">
                  <PrimaryIcon size={16} />
                  {primaryLabel}
                </Button>
              </Link>
              {!isProvider && !pathname.startsWith("/admin") ? (
                <>
                  <Link
                    href={notificationsHref}
                    aria-label="Notifications"
                    className="relative rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Bell size={18} />
                  </Link>
                  <Link
                    href={messagesHref}
                    aria-label="Messages"
                    className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Inbox size={18} />
                  </Link>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-5 pb-[max(5rem,calc(env(safe-area-inset-bottom)+2.5rem))] sm:px-6 sm:py-6 lg:px-8 lg:pb-12">
          <div className="app-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
