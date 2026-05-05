import { Building2, Droplets, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getAreaAnalyticsData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type AreaInsightsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AreaInsightsPage({ params }: AreaInsightsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.calendar" });
  const areaBreakdown = await getAreaAnalyticsData();

  const totalCustomers = areaBreakdown.reduce((sum, area) => sum + area.customerCount, 0);
  const totalDailyLiters = areaBreakdown.reduce((sum, area) => sum + area.dailyConsumption, 0);

  return (
    <AdminShell 
      locale={locale} 
      title="Area Consumption Insights" 
      subtitle="Detailed breakdown of milk distribution and billing by area."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label="Total Areas"
          value={String(areaBreakdown.length)}
          hint="Active routes covered"
          icon={Building2}
          tone="blue"
        />
        <AdminStatCard
          label="Total Customers"
          value={String(totalCustomers)}
          hint="Across all areas"
          icon={Users}
          tone="success"
        />
        <AdminStatCard
          label="Daily Liter Load"
          value={`${totalDailyLiters.toFixed(1)} L`}
          hint="Total morning distribution"
          icon={Droplets}
          tone="warning"
        />
      </div>

      <div className="space-y-4">
        {areaBreakdown.map((area) => (
          <AdminCard key={area.code}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  {typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">Route Code: {area.code}</p>
              </div>
              <AdminBadge tone={area.customerCount > 0 ? "success" : "warning"}>
                {t("insights.customersCount", { count: area.customerCount })}
              </AdminBadge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] bg-[var(--admin-panel-muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                  Average Daily
                </p>
                <p className="mt-3 text-2xl font-bold text-[var(--admin-text)]">
                  {area.dailyConsumption.toFixed(1)} L
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--admin-panel-muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                  Monthly Billed
                </p>
                <p className="mt-3 text-2xl font-bold text-[var(--admin-text)]">
                  {formatCurrencyINR(area.monthlyBilled)}
                </p>
              </div>
              <div className="rounded-[22px] bg-[var(--admin-panel-muted)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                  Outstanding Due
                </p>
                <p className="mt-3 text-2xl font-bold text-[#d14646]">
                  {formatCurrencyINR(area.dueAmount)}
                </p>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminShell>
  );
}
