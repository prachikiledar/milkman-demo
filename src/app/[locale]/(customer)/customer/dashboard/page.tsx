import Link from "next/link";
import {
  Bell,
  Clock,
  Filter,
  History as HistoryIcon,
  MapPin,
  Pause,
  Search,
  Wallet,
  Droplets,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CustomerShell } from "@/components/layout/customer-shell";
import {
  getCustomerDetailData,
  getDefaultCustomerCode,
  getCustomerCalendarData,
} from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";
import { DashboardCalendar } from "@/components/calendar/dashboard-calendar";

type CustomerDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CustomerDashboardPage({
  params,
}: CustomerDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const customerCode = await getDefaultCustomerCode();
  const [customer, calendar] = await Promise.all([
    customerCode ? getCustomerDetailData(customerCode) : null,
    getCustomerCalendarData()
  ]);

  if (!customer) {
    return (
      <CustomerShell locale={locale}>
        <div className="app-header">
          <div>
            <div className="title">{t("dashboard.noCustomerTitle")}</div>
            <div className="subtitle">{t("dashboard.noCustomerSubtitle")}</div>
          </div>
        </div>
        <section className="card">
          <p className="card-sub">{t("dashboard.noCustomer")}</p>
        </section>
      </CustomerShell>
    );
  }

  const latestEntry = customer.recentDeliveries[0];
  const todayStatus = latestEntry?.status ?? "PENDING";

  return (
    <CustomerShell locale={locale}>
      {/* Top greeting row */}
      <div className="app-header">
        <div>
          <div className="eyebrow">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>{customer.areaName}</span>
          </div>
          <div className="title">
            {t("home.greeting", { name: customer.name.split(" ")[0] })}
          </div>
        </div>
        <div className="row gap-2">
          <button type="button" className="icon-btn" aria-label={t("common.notAvailable")}>
            <Bell className="h-5 w-5" />
            <span className="dot" />
          </button>
          <div className="avatar" aria-hidden="true">
            {initials(customer.name)}
          </div>
        </div>
      </div>

      {/* Hero + monthly stats — side by side from tablet up */}
      <div className="split-2 split-2-wide mb-6">
        <section className="hero">
          <span className="eyebrow">{t("home.hero.eyebrow")}</span>
          <h2>{t("home.hero.title")}</h2>
          <p>
            {customer.quantityLabel} · {customer.areaName}
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-sm btn-ghost">
              <Pause className="h-4 w-4" />
              {t("home.hero.pause")}
            </button>
          </div>
        </section>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <article className="stat">
            <div className="stat-label">{t("dashboard.thisMonth")}</div>
            <div className="stat-value">{formatCurrencyINR(customer.billed)}</div>
            <div className="trend up">{t("dashboard.monthHint")}</div>
          </article>
          <article className="stat">
            <div className="stat-label">{t("dashboard.pendingDue")}</div>
            <div className="stat-value">{formatCurrencyINR(customer.due)}</div>
            <div className="trend down">
              {latestEntry?.dateLabel ?? t("dashboard.noUpdate")}
            </div>
          </article>
        </div>
      </div>

      {/* Delivery Calendar - Always Visible */}
      <div className="section-head mt-8">
        <h3>Delivery Calendar</h3>
        <span className="text-[10px] font-bold text-[var(--ink-300)] uppercase tracking-widest">Always Live</span>
      </div>
      
      {calendar && (
        <DashboardCalendar 
          monthLabel={calendar.monthMeta.monthLabel}
          leadingBlankSlots={calendar.monthMeta.leadingBlankSlots}
          days={calendar.days}
        />
      )}

      {/* Subscription details */}
      <div className="section-head mt-10">
        <h3>{t("home.subscriptions")}</h3>
        <Link href={`/${locale}/customer/billing`}>{t("common.viewAll")}</Link>
      </div>
      <article className="card">
        <div className="card-row">
          <div className="thumb">
            <Droplets className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="row between">
              <div className="card-title">{customer.quantityLabel}</div>
              <span className="chip mint">
                <span className="status-dot mint" />
                {t("status.active")}
              </span>
            </div>
            <div className="card-sub">
              {customer.areaName} · {formatCurrencyINR(customer.rate)} {t("common.perLiter")}
            </div>
          </div>
        </div>
        <div className="divider" />
        <div className="row between">
          <div className="row gap-2 text-xs muted">
            <Clock className="h-4 w-4" />
            <span>{t("dashboard.nextDelivery")}</span>
          </div>
          <span className="chip">
            {t("dashboard.deliveryStatus", { status: t(`status.${todayStatus.toLowerCase()}` as never) })}
          </span>
        </div>
      </article>

      {/* Quick actions */}
      <div className="section-head mt-10">
        <h3>{t("home.quickActions")}</h3>
      </div>
      <div className="quick-grid">
        <Link href={`/${locale}/customer/history`} className="quick">
          <span
            className="q-icn"
            style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
          >
            <HistoryIcon className="h-5 w-5" />
          </span>
          <span>{t("home.history")}</span>
        </Link>
        <Link href={`/${locale}/customer/billing`} className="quick">
          <span
            className="q-icn"
            style={{ background: "var(--sun-soft)", color: "#92400E" }}
          >
            <Wallet className="h-5 w-5" />
          </span>
          <span>{t("home.topUp")}</span>
        </Link>
      </div>
    </CustomerShell>
  );
}
