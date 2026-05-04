import { CalendarRange, CircleDollarSign, Droplets, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MonthGrid } from "@/components/calendar/month-grid";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { getAdminCalendarData, getAreasData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";
import { InteractiveCalendar } from "./interactive-calendar";

type AdminCalendarPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ area?: string; status?: string }>;
};

export default async function AdminCalendarPage({ params, searchParams }: AdminCalendarPageProps) {
  const { locale } = await params;
  const { area: areaFilter, status: statusFilter } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.calendar" });
  const tLegend = await getTranslations({ locale, namespace: "calendar.legend" });
  
  const [calendarData, rawAreas] = await Promise.all([
    getAdminCalendarData({ areaCode: areaFilter, status: statusFilter }),
    getAreasData()
  ]);

  const areas = rawAreas.map(a => ({
    code: a.code,
    name: a.name
  }));

  const { monthMeta, days, summary } = calendarData;
  
  const now = new Date();
  const processedDays = days.map(day => {
    const dayDate = new Date(day.dateKey);
    const isFuture = dayDate > now;
    if (isFuture) {
      return { 
        ...day, 
        liters: 0, 
        status: "PENDING" as const, 
        deliveredCount: 0, 
        pausedCount: 0, 
        skippedCount: 0, 
        isFuture: true 
      };
    }
    return { ...day, isFuture: false };
  });

  const peakDay = [...processedDays]
    .filter(d => !d.isFuture)
    .sort((left, right) => (right.liters || 0) - (left.liters || 0))[0] || processedDays[0];

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label={t("stats.monthlyLiters")}
          value={`${summary.totalLiters.toFixed(1)} L`}
          hint="Total delivered till today"
          icon={Droplets}
          tone="blue"
        />
        <AdminStatCard
          label={t("stats.activeCustomers")}
          value={`${summary.activeCustomers}`}
          hint={t("stats.activeCustomersHint")}
          icon={Users}
          tone="success"
        />
        <AdminStatCard
          label={t("stats.peakDay")}
          value={`${peakDay.dayOfMonth} ${monthMeta.monthLabel.slice(0, 3)}`}
          hint={`${peakDay.liters.toFixed(1)} L (Recorded)`}
          icon={CalendarRange}
          tone="warning"
        />
        <AdminStatCard
          label={t("stats.revenueEstimate")}
          value={formatCurrencyINR(summary.totalRevenueEstimate)}
          hint="Calculated till today"
          icon={CircleDollarSign}
          tone="danger"
        />
      </div>

      <div className="mt-6">
        <AdminCard>
          <InteractiveCalendar
            locale={locale}
            monthMeta={monthMeta}
            days={processedDays}
            areas={areas}
            legendLabels={{
              delivered: tLegend("delivered"),
              paused: tLegend("paused"),
              skipped: tLegend("skipped"),
            }}
          />
        </AdminCard>
      </div>
    </AdminShell>
  );
}
