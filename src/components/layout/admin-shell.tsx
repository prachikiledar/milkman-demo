"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Bell,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  CreditCard,
  Droplets,
  Home,
  Menu,
  NotebookText,
  Package2,
  ShoppingCart,
  Store,
  Users,
  X,
  LogOut,
  Search,
  ArrowLeft
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type AdminShellProps = {
  children: React.ReactNode;
  locale: string;
  title: string;
  subtitle: string;
  hideHero?: boolean;
  search?: React.ReactNode;
};

type NavKey =
  | "dashboard"
  | "vendors"
  | "customers"
  | "deliveries"
  | "calendar"
  | "billing"
  | "reports"
  | "area-insights"
  | "purchases"
  | "areas"
  | "products";

type NavItem = {
  href: NavKey | "reports/area-insights";
  icon: typeof Home;
  labelKey?: string;
  isLive?: boolean;
};

const navItems: NavItem[] = [
  { href: "dashboard", icon: Home, isLive: true },
  { href: "vendors", icon: Store },
  { href: "customers", icon: Users },
  { href: "deliveries", icon: Droplets },
  { href: "calendar", icon: CalendarDays },
  { href: "billing", icon: CreditCard },
  { href: "reports", icon: ChartColumn },
  { href: "reports/area-insights" as any, icon: NotebookText, labelKey: "areaInsights" },
  { href: "purchases", icon: ShoppingCart },
  { href: "areas", icon: Building2 },
  { href: "products", icon: Package2 },
];

export function AdminShell({
  children,
  locale,
  title,
  subtitle,
  hideHero,
  search,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const tShell = useTranslations("admin.shell");
  const tNav = useTranslations("admin.nav");

  const isDashboard = pathname === `/${locale}/admin/dashboard`;

  const renderNavItem = ({ href, icon: Icon, labelKey, isLive }: NavItem) => {
    const target = `/${locale}/admin/${href}`;
    const isActive = pathname === target || pathname.startsWith(`${target}/`);
    const label = labelKey ? tNav(labelKey) : tNav(href);

    return (
      <Link
        key={href}
        href={target}
        onClick={() => setIsDrawerOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-white shadow-sm border border-gray-100 text-[#064e3b]"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-[#22c55e]" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={2.5} />
        <span className="flex-1 text-sm font-bold tracking-tight">{label}</span>
        {isLive && (
          <span className="text-[9px] font-black bg-green-50 text-[#22c55e] px-1.5 py-0.5 rounded-md">LIVE</span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex font-sans overflow-x-hidden">

      {/* DESKTOP SIDEBAR */}
      <aside className="w-[280px] bg-white border-r border-gray-200/60 hidden lg:flex flex-col h-screen sticky top-0 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20 text-white">
            <Droplets size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900 leading-none">Dairly</h1>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tShell("brand")}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-3">Main Navigation</p>
          {navItems.map(renderNavItem)}
        </nav>

        <div className="mt-auto pt-6 space-y-4">
          <div className="bg-[#064e3b] rounded-[24px] p-5 text-white relative overflow-hidden group">
            <p className="text-[10px] font-bold text-green-300/80 mb-3 relative z-10">{tShell("helpDescription")}</p>
            <button className="bg-white text-[#064e3b] text-[11px] font-black px-4 py-2 rounded-lg relative z-10 hover:bg-green-50 transition-colors">
              {tShell("helpTitle")}
            </button>
            <div className="absolute -right-4 -bottom-4 w-20 h-28 bg-white/10 rounded-t-lg rotate-12" />
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={cn("fixed inset-0 z-40 bg-[#064e3b]/40 backdrop-blur-sm lg:hidden transition-opacity", isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setIsDrawerOpen(false)} />
      <aside className={cn("fixed left-0 top-0 z-50 h-full w-[300px] bg-white p-6 transition-transform lg:hidden", isDrawerOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between mb-8">
          <span className="font-black tracking-tighter text-xl">Dairly</span>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2"><X size={20} /></button>
        </div>
        <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-16 sm:h-20 bg-white border-b border-gray-200/50 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsDrawerOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu /></button>
            {!isDashboard && (
              <button onClick={() => router.back()} className="hidden md:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Go Back">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="hidden md:flex items-center gap-3 bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-2 w-full max-w-md group focus-within:border-green-500 transition-all">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
          </div>

        <aside
          className={cn(
            "fixed left-0 top-[64px] z-50 h-[calc(100vh-64px)] w-[308px] max-w-[86vw] p-4 transition-transform duration-200 lg:hidden",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="admin-panel flex h-full flex-col rounded-[32px] p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
                    {tShell("brand")}
                  </p>
                  <p className="text-lg font-bold text-[var(--admin-text)]">{tShell("mobileTitle")}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center font-bold text-[#064e3b] text-xs">
                AD
              </div>
              <button 
                title="Logout"
                onClick={() => router.push(`/${locale}`)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all ml-1"
              >
                <LogOut size={18} />
              </button>
            </div>

            <div className="admin-panel-muted mt-6 rounded-[24px] p-4">
              <p className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-wider">
                {tShell("activeRoute")}
              </p>
              <p className="mt-1 text-base font-bold text-[var(--admin-text)]">
                {tShell("customersThisCycle", { count: 128 })}
              </p>
            </div>

            <nav className="mt-6 space-y-2">{navItems.map(renderNavItem)}</nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-16 z-30 mb-8 sm:top-[76px] sm:mb-6">
            <div className="admin-panel rounded-[30px] px-4 py-3 shadow-lg shadow-blue-900/5 sm:px-5 sm:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    className="admin-icon-button h-11 w-11 lg:hidden"
                    aria-label={tShell("openMenu")}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--admin-muted)] sm:text-[13px]">
                      {tShell("workspaceEyebrow")}
                    </p>
                    <p className="truncate text-base font-bold text-[var(--admin-text)] sm:text-xl">
                      {title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="admin-icon-button h-11 w-11"
                    aria-label={tShell("notifications")}
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="mt-4 space-y-8 pb-24 sm:mt-0 sm:space-y-4">
            {!hideHero && (
              <section className="admin-panel rounded-[32px] px-5 py-5 sm:px-6 hidden md:block">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--admin-muted)]">
                      {tShell("heroEyebrow")}
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--admin-text)] sm:text-3xl">
                      {title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--admin-muted)] sm:text-[15px]">
                      {subtitle}
                    </p>
                    {search && (
                      <div className="mt-4 w-full sm:mt-0 sm:max-w-md">
                        {search}
                      </div>
                    )}
                  </div>
                  {tShell("liveMode") && (
                    <div className="admin-panel-muted rounded-[22px] px-4 py-3 text-sm text-[var(--admin-muted)]">
                      <span className="font-semibold text-[var(--admin-text)]">
                        {tShell("liveMode")}
                      </span>
                      {tShell("superAdminPreview") && (
                        <>
                          <span className="mx-2 text-[var(--admin-border)]">•</span>
                          <span>{tShell("superAdminPreview")}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {children}
          </main>

          {/* Sticky Bottom Nav (Mobile Only) */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex items-center justify-around h-16 px-2 lg:hidden">
            {[
              { href: "dashboard", icon: Home },
              { href: "deliveries", icon: Droplets },
              { href: "customers", icon: Users },
              { href: "billing", icon: CreditCard },
            ].map(({ href, icon: Icon }) => {
              const target = `/${locale}/admin/${href}`;
              const isActive = pathname === target || pathname.startsWith(`${target}/`);
              return (
                <Link
                  key={href}
                  href={target}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-all active:scale-90",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                  <span className={cn("text-[10px] font-bold", isActive ? "text-blue-600" : "text-slate-400")}>
                    {tNav(href)}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}