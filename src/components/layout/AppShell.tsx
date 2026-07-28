"use client";

import Link from "next/link";
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
  MessagesSquare,
  Search,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  Store,
  UserCheck,
  UserRound,
  UsersRound,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { VentureLogo } from "@/components/brand/VentureLogo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

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
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/reports", label: "Reports", icon: FileChartColumn },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/disputes", label: "Disputes", icon: TriangleAlert },
  { href: "/admin/settings", label: "Settings", icon: Settings2 }
];

function navigationFor(pathname: string) {
  if (pathname.startsWith("/investor")) return { label: "Investor / Organizer", items: investorNav };
  if (pathname.startsWith("/provider")) return { label: "Service Provider", items: providerNav };
  if (pathname.startsWith("/validator")) return { label: "Validator", items: validatorNav };
  if (pathname.startsWith("/admin")) return { label: "Admin", items: adminNav };
  return { label: "Founder", items: founderNav };
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigation = navigationFor(pathname);
  const currentItem = [...navigation.items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href)) ?? navigation.items[0];
  const isInvestor = pathname.startsWith("/investor");
  const isProvider = pathname.startsWith("/provider");
  const isValidator = pathname.startsWith("/validator");
  const isAdmin = pathname.startsWith("/admin");
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
  const supabaseReady = isSupabaseConfigured();

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
      <aside className="scrollbar-thin fixed inset-y-0 left-0 z-40 hidden h-dvh w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:flex">
        <VentureLogo className="px-2" />

        <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <ShieldCheck size={16} />
            {navigation.label} workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-blue-800">
            Role-scoped navigation keeps documents, reviews, services, and conversations in the correct workflow.
          </p>
        </div>

        <nav className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{navigation.label}</p>
          <div className="mt-2 space-y-1">
            {navigation.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200",
                    active ? "bg-primary text-white shadow-panel" : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 size={16} className="text-primary" />
            Workflow rule
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Conversations begin after reviewer interest. Free founders receive a feedback preview and upgrade prompt.
          </p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="lg:hidden">
                <VentureLogo compact />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{currentItem.label}</p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">{navigation.label} workspace</p>
              </div>
              <Link
                href={discoveryHref}
                aria-label={`Open ${navigation.label.toLowerCase()} discovery`}
                className="ml-3 hidden w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-slate-700 md:flex"
              >
                <Search size={17} className="shrink-0 text-slate-400" />
                <span className="truncate text-sm">Find {isProvider ? "services" : isValidator ? "requests" : isAdmin ? "users" : "opportunities"}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href={primaryHref} className="hidden sm:block">
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
                    className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Bell size={18} />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  </Link>
                  <Link
                    href={messagesHref}
                    aria-label="Messages"
                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Inbox size={18} />
                  </Link>
                </>
              ) : null}
              {supabaseReady ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 sm:flex"
                >
                  <LayoutDashboard size={16} />
                  Switch role
                </Link>
              )}
            </div>
          </div>
          <nav aria-label={`${navigation.label} navigation`} className="scrollbar-none flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2 lg:hidden">
            {navigation.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    active ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primary"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="min-w-0 px-4 py-5 pb-[max(5rem,calc(env(safe-area-inset-bottom)+2.5rem))] sm:px-6 sm:py-6 lg:px-8 lg:pb-12">
          <div className="app-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
