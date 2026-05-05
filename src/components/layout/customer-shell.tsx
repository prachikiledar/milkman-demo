"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  History,
  Home,
  IndianRupee,
  Plus,
  User,
  Droplets,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

type CustomerShellProps = {
  children: React.ReactNode;
  locale: string;
};

type NavKey = "dashboard" | "calendar" | "billing" | "history" | "profile";

type NavItem = {
  key: NavKey;
  href: string;
  labelKey:
    | "nav.home"
    | "nav.calendar"
    | "nav.billing"
    | "nav.history"
    | "nav.profile";
  icon: typeof Home;
  fab?: boolean;
};

const navItems: NavItem[] = [
  { key: "dashboard", href: "dashboard", labelKey: "nav.home", icon: Home },
  { key: "calendar", href: "calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { key: "billing", href: "billing", labelKey: "nav.billing", icon: Plus, fab: true },
  { key: "history", href: "history", labelKey: "nav.history", icon: History },
  { key: "profile", href: "profile", labelKey: "nav.profile", icon: User },
];

export function CustomerShell({ children, locale }: CustomerShellProps) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Brand Header */}
      <header className="platform-header">
        <Link href={`/${locale}`} className="brand" aria-label="Dairy">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2h8v4l3 6c1 2 1 4 1 6v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V18c0-2 0-4 1-6l3-6V2z" />
            <path d="M11 14h10" />
          </svg>
          <span className="brand-text">
            <span className="brand-name">{t("brand.name")}</span>
            <span className="brand-tagline">{t("brand.tagline")}</span>
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="app-shell-main pt-2">{children}</main>

      <nav className="bottom-nav border-t border-slate-100 bg-white/95 backdrop-blur-md" aria-label="Primary">
        {navItems.map(({ key, href, labelKey, icon: Icon, fab }) => {
          const target = `/${locale}/customer/${href}`;
          const isActive = pathname === target;
          
          if (fab) {
            return (
              <div key={key} className="flex items-center justify-center -mt-8 px-2">
                <Link
                  href={target}
                  className="w-[60px] h-[60px] rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label={t(labelKey as never)}
                >
                  <Plus className="h-8 w-8" strokeWidth={3} />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={key}
              href={target}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all active:scale-90",
                isActive ? "text-slate-900" : "text-slate-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon 
                className={cn("h-6 w-6 transition-transform", isActive && "scale-105")} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={cn(
                "text-[11px] font-bold tracking-tight",
                isActive ? "text-slate-900" : "text-slate-400"
              )}>
                {t(labelKey as never)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
