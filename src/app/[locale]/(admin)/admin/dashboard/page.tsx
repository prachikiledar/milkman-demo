import {
  Activity,
  BadgeIndianRupee,
  CircleAlert,
  Droplets,
  Gauge,
  MoveRight,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import {
  getAdminCalendarData,
  getDashboardData,
  getPurchaseLedgerData,
} from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.dashboard" });
  const tStatus = await getTranslations({ locale, namespace: "status" });
  const [{ kpis, routeSnapshot, attentionCustomers }, purchaseLedger, adminCalendar] =
    await Promise.all([getDashboardData(), getPurchaseLedgerData(), getAdminCalendarData()]);

  const routeCoverage = kpis.activeCustomers
    ? Math.round((kpis.todayDelivered / kpis.activeCustomers) * 100)
    : 0;
  const collectionRate = kpis.monthlySales
    ? Math.round(((kpis.monthlySales - kpis.monthlyDue) / kpis.monthlySales) * 100)
    : 0;
  const inwardCoverage = adminCalendar.summary.totalLiters
    ? Math.min(
      Math.round(
        (purchaseLedger.summary.totalMilkInward / Math.max(adminCalendar.summary.totalLiters, 1)) *
        100,
      ),
      100,
    )
    : 0;

  const followUpCount = attentionCustomers.filter((entry) => entry.issue === "Payment overdue").length;

  const progressRows: Array<{ label: string; value: number }> = [
    { label: t("progress.deliveryCompletion"), value: routeCoverage },
    { label: t("progress.paymentRecovery"), value: collectionRate },
    { label: t("progress.milkInwardCoverage"), value: inwardCoverage },
  ];

  const quickActions: Array<[string, string]> = [
    [t("quickActions.addCustomer"), `/admin/customers/new`],
    [t("quickActions.markDeliveries"), `/admin/deliveries`],
    [t("quickActions.recordPayment"), `/admin/billing`],
    [t("quickActions.capturePurchase"), `/admin/purchases`],
  ];

  const performanceCards: Array<[string, string, string]> = [
    [t("performance.pending"), String(kpis.todayPending), "admin-badge-danger"],
    [t("performance.delivered"), String(kpis.todayDelivered), "admin-badge-success"],
    [
      t("performance.unpaidPurchases"),
      String(purchaseLedger.summary.unpaidEntries),
      "admin-badge-warning",
    ],
    [
      t("performance.milkInward"),
      `${purchaseLedger.summary.totalMilkInward.toFixed(1)} L`,
      "admin-badge-blue",
    ],
  ];

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={t("stats.activeCustomers")}
          value={String(kpis.activeCustomers)}
          hint={t("stats.activeCustomersHint", { count: kpis.todayPending })}
          icon={Users}
        />
        <AdminStatCard
          label={t("stats.todaysDeliveries")}
          value={String(kpis.todayDelivered)}
          hint={t("stats.todaysDeliveriesHint", { count: kpis.todayPending })}
          icon={Droplets}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.monthlySales")}
          value={formatCurrencyINR(kpis.monthlySales)}
          hint={t("stats.monthlySalesHint")}
          icon={BadgeIndianRupee}
          tone="warning"
        />
        <AdminStatCard
          label={t("stats.outstandingDues")}
          value={formatCurrencyINR(kpis.monthlyDue)}
          hint={t("stats.outstandingDuesHint", { count: followUpCount })}
          icon={CircleAlert}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <AdminCard className="overflow-hidden">
          <div className="rounded-[24px] bg-[linear-gradient(180deg,#edf4ff_0%,#e8efff_100%)] p-5">
            <AdminBadge tone="blue">{t("hero.badge")}</AdminBadge>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
              {t("hero.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--admin-muted)]">
              {t("hero.description")}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/deliveries?start=1"
                className="admin-primary-button px-4 py-3 text-sm font-semibold"
              >
                {t("hero.startRun")}
                <MoveRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/purchases"
                className="admin-secondary-button px-4 py-3 text-sm font-semibold"
              >
                {t("hero.reviewLedger")}
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {routeSnapshot.slice(0, 3).map((area) => (
              <article key={area.areaCode} className="admin-panel-muted rounded-[22px] px-4 py-4">
                <p className="text-sm font-medium text-[var(--admin-muted)]">
                  {typeof area.areaName === "string" ? area.areaName : (area.areaName[locale as keyof typeof area.areaName] || area.areaName.en)}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                  {t("routeCustomers", { count: area.customerCount })}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--admin-primary-strong)]">
                  {t("routeSummary", {
                    delivered: area.deliveredCount,
                    liters: area.liters.toFixed(1),
                  })}
                </p>
              </article>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  {t("quickActions.title")}
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {t("quickActions.subtitle")}
                </p>
              </div>
              <Gauge className="h-5 w-5 text-[var(--admin-primary-strong)]" />
            </div>
            <div className="mt-4 grid gap-3">
              {quickActions.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="admin-secondary-button w-full justify-between px-4 py-3 text-left text-sm font-semibold"
                >
                  <span>{label}</span>
                  <MoveRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  {t("progress.title")}
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("progress.subtitle")}</p>
              </div>
              <AdminBadge tone="success">{tStatus("onTrack")}</AdminBadge>
            </div>
            <div className="mt-5 space-y-4">
              {progressRows.map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-[var(--admin-text)]">{label}</p>
                    <p className="text-[var(--admin-muted)]">{value}%</p>
                  </div>
                  <div className="admin-progress-track h-2.5">
                    <div className="admin-progress-fill" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("attention.title")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("attention.subtitle")}</p>
            </div>
            <Activity className="h-5 w-5 text-[var(--admin-primary-strong)]" />
          </div>
          <div className="mt-4 space-y-3">
            {attentionCustomers.map((entry) => (
              <div
                key={entry.customerCode}
                className="admin-panel-muted flex flex-col gap-3 rounded-[22px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--admin-text)]">{entry.name}</p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">{entry.info}</p>
                </div>
                <AdminBadge tone={entry.tone as "blue" | "danger" | "warning"}>
                  {entry.issue}
                </AdminBadge>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("performance.title")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("performance.subtitle")}</p>
            </div>
            <Link
              href="/admin/reports"
              className="admin-outline-button px-4 py-3 text-sm font-semibold"
            >
              {t("performance.viewSummary")}
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {performanceCards.map(([label, value, badgeClass]) => (
              <div key={label} className="admin-panel-muted rounded-[24px] px-4 py-5">
                <span className={`admin-badge ${badgeClass}`}>{label}</span>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
