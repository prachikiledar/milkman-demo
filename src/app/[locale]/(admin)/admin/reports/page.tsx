import { BarChart3, ChartSpline, CircleDollarSign, MapPinned, ShoppingBasket } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getPurchaseLedgerData, getReportsData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AdminReportsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminReportsPage({ params }: AdminReportsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.reports" });
  const [{ areaAnalytics, summary }, purchaseLedger] = await Promise.all([
    getReportsData(),
    getPurchaseLedgerData(),
  ]);
  const topArea = summary.topArea;
  const topAreaName = topArea
    ? typeof topArea.name === "string"
      ? topArea.name
      : (topArea.name[locale as keyof typeof topArea.name] || topArea.name.en)
    : "";

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("stats.areaCoverage")}
          value={t("stats.areaCoverageValue", { count: areaAnalytics.length })}
          hint={t("stats.areaCoverageHint")}
          icon={MapPinned}
          tone="blue"
        />
        <AdminStatCard
          label={t("stats.topConsumption")}
          value={`${topArea?.monthlyConsumption?.toFixed(1) ?? "0.0"} L`}
          hint={
            topArea
              ? t("stats.topConsumptionHintArea", { area: topAreaName })
              : t("stats.topConsumptionHintNone")
          }
          icon={CircleDollarSign}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.collectionRate")}
          value={`${summary.collectionRate}%`}
          hint={t("stats.collectionRateHint", {
            amount: formatCurrencyINR(summary.purchaseTotal),
          })}
          icon={ChartSpline}
          tone="warning"
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("areaAnalyticsTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {t("areaAnalyticsSubtitle")}
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-[var(--admin-primary-strong)]" />
          </div>

          <div className="mt-4 grid gap-3">
            {areaAnalytics.map((area) => (
              <article key={area.code} className="admin-panel-muted rounded-[24px] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--admin-text)]">
                        {typeof area.name === "string" 
                          ? area.name 
                          : (area.name[locale as keyof typeof area.name] || area.name.en)}
                      </p>
                      <AdminBadge tone="blue">{area.code}</AdminBadge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {t("customersMapped", { count: area.customerCount })}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("daily")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {area.dailyConsumption.toFixed(1)} L
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("monthly")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {area.monthlyConsumption.toFixed(1)} L
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("billed")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(area.monthlyBilled)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                        {t("due")}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--admin-text)]">
                        {formatCurrencyINR(area.dueAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">{t("trendTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("trendSubtitle")}</p>
          <div className="mt-6 flex h-[260px] items-end gap-3 rounded-[24px] bg-[linear-gradient(180deg,#f9fbff_0%,#edf3ff_100%)] px-4 py-5">
            {areaAnalytics.map((area, index) => (
              <div key={area.code} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={
                    index === 0
                      ? "w-full rounded-full bg-[var(--admin-primary)]"
                      : "w-full rounded-full bg-[#b8d0fb]"
                  }
                  style={{ height: `${Math.max(area.monthlyConsumption * 2, 14)}px` }}
                />
                <span className="text-center text-[10px] font-medium leading-4 text-[var(--admin-muted)]">
                  {area.code.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="admin-panel-muted rounded-[22px] p-4">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-4 w-4 text-[var(--admin-primary-strong)]" />
                <p className="text-sm font-medium text-[var(--admin-text)]">
                  {t("purchaseTotal")}
                </p>
              </div>
              <p className="mt-3 text-xl font-semibold text-[var(--admin-text)]">
                {formatCurrencyINR(purchaseLedger.summary.totalPurchaseAmount)}
              </p>
            </div>
            <div className="admin-panel-muted rounded-[22px] p-4">
              <p className="text-sm font-medium text-[var(--admin-text)]">{t("milkInward")}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--admin-text)]">
                {purchaseLedger.summary.totalMilkInward.toFixed(1)} L
              </p>
            </div>
            <div className="admin-panel-muted rounded-[22px] p-4">
              <p className="text-sm font-medium text-[var(--admin-text)]">{t("unpaidRows")}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--admin-text)]">
                {purchaseLedger.summary.unpaidEntries}
              </p>
            </div>
          </div>
        </AdminCard>
      </section>
    </AdminShell>
  );
}
