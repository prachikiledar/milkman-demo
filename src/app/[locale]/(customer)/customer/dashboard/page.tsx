"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  History as HistoryIcon,
  MapPin,
  Pause,
  Wallet,
  Droplets,
  Loader2,
  Search,
  CalendarDays,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CustomerShell } from "@/components/layout/customer-shell";
import { formatCurrencyINR } from "@/lib/utils";
import { DashboardCalendar } from "@/components/calendar/dashboard-calendar";

export default function CustomerDashboardPage() {
  const t = useTranslations();
  const { locale } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("token_CUSTOMER") || localStorage.getItem("token");
        if (!token) {
          window.location.href = `/${locale}/login?role=customer`;
          return;
        }

        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          // Mapping API response to expected dashboard state
          // For the simple flow, we'll enhance the user object with some dummy dashboard data
          const userData = data.user;
          const currentName = userData.name?.[locale as string] || userData.name?.en || userData.phone;
          const currentArea = data.area?.name?.[locale as string] || data.area?.name?.en || data.profile?.areaName || "Landra";

          setCustomer({
            name: currentName,
            phone: userData.phone,
            areaName: currentArea,
            quantityLabel: `4.0 ${t("common.liters")}`, // Dummy quantity
            rate: 66,
            billed: 1848,
            due: 660,
            customerCode: `CUST-${userData.phone.slice(-4)}`,
            recentDeliveries: [
              { dateLabel: "Today", status: "DELIVERED" },
              { dateLabel: "Yesterday", status: "DELIVERED" },
            ],
            calendarData: {
              monthMeta: {
                monthLabel: "May 2026",
                leadingBlankSlots: 5,
              },
              days: Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const dateKey = `2026-05-${String(day).padStart(2, "0")}`;
                return {
                  dayOfMonth: day,
                  dateKey,
                  dateLabel: `${day} May 2026`,
                  status: i < 4 ? "DELIVERED" : "PENDING",
                  liters: 4.0,
                  unit: t("common.liters"),
                  isFuture: i >= 4,
                };
              }),
            },
          });
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  const demoNames: Record<string, string> = {
    en: "Ritu",
    hi: "रितु",
    pa: "ਰਿਤੂ"
  };

  const demoAreas: Record<string, string> = {
    en: "Landra",
    hi: "लांड्रा",
    pa: "ਲਾਂਡਰਾ"
  };

  // If customer is still null, we'll show the dummy UI anyway as requested
  const displayCustomer = customer || {
    name: demoNames[locale as string] || "Ritu",
    areaName: demoAreas[locale as string] || "Landra",
    quantityLabel: `4.0 ${t("common.liters")}`,
    billed: 1848,
    due: 660,
    rate: 66,
    recentDeliveries: [],
  };

  // If the name is actually a phone number (e.g. 10 digits), fallback to "Ritu" for this demo
  if (/^\d{10}$/.test(displayCustomer.name)) {
    displayCustomer.name = demoNames[locale as string] || "Ritu";
  }

  const initials = displayCustomer.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <CustomerShell locale={locale as string}>
      <div className="px-4 pb-10">
        {/* App Header */}
        <div className="app-header">
          <div>
            <div className="eyebrow">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{displayCustomer.areaName}</span>
            </div>
            <div className="title">{t("home.greeting", { name: displayCustomer.name.split(" ")[0] })}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="icon-btn" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="dot"></span>
            </button>
            <div className="avatar" aria-hidden="true">{initials || "RM"}</div>
          </div>
        </div>

        {/* Search */}
        <div className="search mb-3">
          <Search className="h-4 w-4 text-[color:var(--ink-300)]" aria-hidden="true" />
          <input 
            placeholder={t("home.searchPlaceholder")} 
            aria-label={t("home.searchPlaceholder")} 
          />
          <button type="button" className="icon-btn" aria-label={t("common.filter")} style={{ width: 32, height: 32, boxShadow: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-funnel h-4 w-4" aria-hidden="true">
              <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <section className="hero">
          <span className="eyebrow">{t("home.hero.eyebrow")}</span>
          <h2>{t("home.hero.title")}</h2>
          <p>{displayCustomer.quantityLabel} · {displayCustomer.areaName}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-sm btn-ghost">
              <Pause className="h-4 w-4" />
              {t("home.hero.pause")}
            </button>
            <button type="button" className="btn btn-sm btn-ghost">{t("home.hero.track")}</button>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="section-head">
          <h3>{t("home.quickActions")}</h3>
        </div>
        <div className="quick-grid">
          <a className="quick" href="#">
            <span className="q-icn" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}>
              <Droplets className="h-5 w-5" />
            </span>
            <span>{t("home.subscribe")}</span>
          </a>
          <a className="quick" href="#">
            <span className="q-icn" style={{ background: 'var(--mint-soft)', color: 'rgb(6, 95, 70)' }}>
              <CalendarDays className="h-5 w-5" />
            </span>
            <span>{t("home.schedule")}</span>
          </a>
          <a className="quick" href="#">
            <span className="q-icn" style={{ background: 'var(--sun-soft)', color: 'rgb(146, 64, 14)' }}>
              <Wallet className="h-5 w-5" />
            </span>
            <span>{t("home.topUp")}</span>
          </a>
          <a className="quick" href="#">
            <span className="q-icn" style={{ background: 'var(--rose-soft)', color: 'rgb(159, 18, 57)' }}>
              <HistoryIcon className="h-5 w-5" />
            </span>
            <span>{t("home.history")}</span>
          </a>
        </div>

        {/* Delivery Calendar Section - PLACED HERE AS REQUESTED */}
        {displayCustomer.calendarData && (
          <section className="mt-8">
            <div className="section-head">
              <h3>{t("calendar.title")}</h3>
            </div>
            <div className="w-full">
              <DashboardCalendar 
                monthLabel={new Date().toLocaleDateString(locale as string, { month: 'long', year: 'numeric' }).toUpperCase()}
                leadingBlankSlots={displayCustomer.calendarData.monthMeta.leadingBlankSlots}
                days={displayCustomer.calendarData.days}
              />
            </div>
          </section>
        )}

        {/* Subscriptions */}
        <div className="section-head">
          <h3>{t("home.subscriptions")}</h3>
          <button className="text-[12px] font-bold text-blue-600">{t("common.viewAll")}</button>
        </div>
        <article className="card">
          <div className="card-row">
            <div className="thumb">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="card-title">{displayCustomer.quantityLabel}</div>
                <span className="chip mint"><span className="status-dot mint"></span>{t("status.active")}</span>
              </div>
              <div className="card-sub">{displayCustomer.areaName} · {formatCurrencyINR(displayCustomer.rate)} {t("common.perLiter")}</div>
            </div>
          </div>
          <div className="h-px bg-gray-50 w-full my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{t("dashboard.nextDelivery")}</span>
            </div>
            <span className="chip">{t("dashboard.deliveryStatus", { status: t("status.pending") })}</span>
          </div>
        </article>

        {/* Stats */}
        <div className="section-head">
          <h3>{t("dashboard.thisMonth")}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <article className="stat p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("dashboard.thisMonth")}</div>
            <div className="text-[22px] font-black text-gray-900">{formatCurrencyINR(displayCustomer.billed)}</div>
            <div className="mt-1 text-[10px] text-emerald-500 font-bold leading-tight">{t("dashboard.monthHint")}</div>
          </article>
          <article className="stat p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t("dashboard.pendingDue")}</div>
            <div className="text-[22px] font-black text-rose-500">{formatCurrencyINR(displayCustomer.due)}</div>
            <div className="mt-1 text-[10px] text-gray-400 font-bold leading-tight">{t("dashboard.noUpdate")}</div>
          </article>
        </div>
      </div>
    </CustomerShell>
  );
}
