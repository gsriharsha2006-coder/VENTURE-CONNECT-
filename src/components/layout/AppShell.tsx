"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  Compass,
  FileChartColumn,
  FilePlus2,
  Home,
  Inbox,
  Lightbulb,
  LogOut,
  Menu,
  MessagesSquare,
  Settings2,
  UsersRound,
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
  { href: "/dashboard/idea-workspace", label: "Idea Workspace", icon: Lightbulb },
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Compass },
  { href: "/dashboard/vc-readiness", label: "VC Readiness Report", icon: FileChartColumn },
  { href: "/dashboard/messages", label: "Messages", icon: MessagesSquare }
];

const incubatorNav: NavItem[] = [
  { href: "/organisation", label: "Overview", icon: Home },
  { href: "/organisation/publish", label: "Post Program", icon: FilePlus2 },
  { href: "/organisation/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/organisation/interested", label: "Interested Applications", icon: Inbox },
  { href: "/organisation/messages", label: "Messages", icon: MessagesSquare }
];

const hackathonNav: NavItem[] = [
  { href: "/organisation", label: "Overview", icon: Home },
  { href: "/organisation/publish", label: "Post Hackathon", icon: FilePlus2 },
  { href: "/organisation/forms", label: "Registration Form", icon: ClipboardCheck },
  { href: "/organisation/applications", label: "Applications", icon: Inbox }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Pilot Summary", icon: Home },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/opportunities", label: "Opportunities", icon: Compass },
  { href: "/admin/reports", label: "Readiness Reports", icon: FileChartColumn },
  { href: "/admin/settings", label: "Settings", icon: Settings2 }
];

function navigationFor(role: string) {
  const databaseRole = toDatabaseRole(role);
  if (databaseRole === "incubator") return { label: "Incubator", items: incubatorNav, kind: "organisation" as const };
  if (databaseRole === "hackathon_organizer") return { label: "Hackathon Organiser", items: hackathonNav, kind: "organisation" as const };
  if (databaseRole === "admin") return { label: "Pilot Admin", items: adminNav, kind: "admin" as const };
  return { label: "Founder / Student", items: founderNav, kind: "founder" as const };
}

function isActive(pathname: string, href: string) {
  if (href === "/organisation" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, role }: { children: React.ReactNode; role: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navigation = navigationFor(role);
  const currentItem = [...navigation.items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href));
  const databaseRole = toDatabaseRole(role);
  const isOrganisation = navigation.kind === "organisation";
  const isAdmin = navigation.kind === "admin";
  const overviewHref = isOrganisation ? "/organisation" : isAdmin ? "/admin" : "/dashboard";
  const notificationsHref = isOrganisation ? "/organisation/notifications" : "/notifications";
  const messagesHref = isOrganisation ? "/organisation/messages" : "/dashboard/messages";
  const primaryHref = isOrganisation ? "/organisation/publish" : isAdmin ? "/admin" : "/dashboard/idea-workspace";
  const primaryLabel = isOrganisation
    ? databaseRole === "hackathon_organizer" ? "Post hackathon" : "Post program"
    : isAdmin ? "Pilot summary" : "Create startup idea";
  const PrimaryIcon = isOrganisation ? FilePlus2 : isAdmin ? Home : Lightbulb;

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const opener = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      opener?.focus();
    };
  }, [mobileOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/auth");
  }

  const NavigationLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav aria-label={`${navigation.label} navigation`} className="space-y-1">
      {navigation.items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={mobile ? () => setMobileOpen(false) : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
          >
            <Icon aria-hidden="true" size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <aside className="scrollbar-thin fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 pb-5 pt-5 lg:flex">
        <Link href={overviewHref} aria-label="Open account overview"><VentureLogo className="px-2" /></Link>
        <div className="mt-7 border-y border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{navigation.label}</div>
        <div className="mt-4"><NavigationLinks /></div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/35" onClick={() => setMobileOpen(false)} />
          <aside id="mobile-navigation" role="dialog" aria-modal="true" className="scrollbar-thin relative flex h-dvh w-[min(88vw,320px)] flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <VentureLogo />
              <button ref={closeButtonRef} type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="rounded-lg border border-slate-200 p-2.5"><X size={18} /></button>
            </div>
            <p className="mt-7 px-3 text-sm font-semibold text-slate-500">{navigation.label}</p>
            <div className="mt-2"><NavigationLinks mobile /></div>
            <Link href={primaryHref} onClick={() => setMobileOpen(false)} className="mt-auto pt-6"><Button className="w-full"><PrimaryIcon size={16} />{primaryLabel}</Button></Link>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button ref={menuButtonRef} type="button" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(true)} className="rounded-lg border border-slate-200 p-2.5 lg:hidden"><Menu size={18} /></button>
              <Link href={overviewHref} className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{currentItem?.label ?? "Overview"}</p>
                <p className="hidden truncate text-xs text-slate-500 sm:block">{navigation.label} workspace</p>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href={primaryHref} className="hidden lg:block"><Button variant="secondary" size="sm"><PrimaryIcon size={16} />{primaryLabel}</Button></Link>
              {!isAdmin ? (
                <>
                  <Link href={notificationsHref} aria-label="Notifications" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-blue-50"><Bell size={18} /></Link>
                  {(navigation.kind === "founder" || databaseRole === "incubator") ? <Link href={messagesHref} aria-label="Messages" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-blue-50"><Inbox size={18} /></Link> : null}
                </>
              ) : null}
              <button type="button" onClick={handleLogout} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-blue-50"><LogOut size={16} /><span className="hidden sm:inline">Log out</span></button>
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
