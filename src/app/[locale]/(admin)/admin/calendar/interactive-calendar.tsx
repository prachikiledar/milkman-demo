"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, MapPin, X } from "lucide-react";
import { MonthGrid } from "@/components/calendar/month-grid";
import { AdminBadge } from "@/components/layout/admin-ui";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { CalendarDayRecord } from "@/lib/calendar";

type InteractiveCalendarProps = {
  locale: string;
  monthMeta: { monthLabel: string; leadingBlankSlots: number };
  days: CalendarDayRecord[];
  areas: { code: string; name: string | { en: string; hi: string; pa: string } }[];
  legendLabels: { delivered: string; paused: string; skipped: string };
};

export function InteractiveCalendar({
  locale,
  monthMeta,
  days,
  areas,
  legendLabels,
}: InteractiveCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("admin.calendar");

  const currentArea = searchParams.get("area") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateClick = (dateKey: string) => {
    router.push(`/${locale}/admin/deliveries?date=${dateKey}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[var(--admin-panel-muted)] px-4 py-2 text-sm">
            <Filter className="h-4 w-4 opacity-60" />
            <span className="font-semibold">Filters</span>
          </div>
          
          {/* Area Filter */}
          <div className="relative inline-block">
            <select
              value={currentArea}
              onChange={(e) => updateFilter("area", e.target.value)}
              className="appearance-none rounded-2xl border border-[var(--admin-border)] bg-white px-4 py-2 pr-10 text-sm font-medium transition-all hover:border-[var(--admin-primary-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-soft)]"
            >
              <option value="">All Areas</option>
              {areas.map((area) => (
                <option key={area.code} value={area.code}>
                  {typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}
                </option>
              ))}
            </select>
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
          </div>

          {currentArea && (
            <button
              onClick={() => updateFilter("area", "")}
              className="flex items-center gap-1 rounded-full bg-[var(--admin-danger-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--admin-danger-strong)] transition hover:scale-105"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <AdminBadge tone="blue">Month View</AdminBadge>
          <div className="h-4 w-px bg-[var(--admin-border)]" />
          <p className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest">
            {days.filter(d => !d.isFuture).length} Recorded Days
          </p>
        </div>
      </div>

      <MonthGrid
        monthLabel={monthMeta.monthLabel}
        leadingBlankSlots={monthMeta.leadingBlankSlots}
        days={days}
        variant="admin"
        legendLabels={legendLabels}
        onDateClick={handleDateClick}
        renderFooter={(day) => (
          <>
            <div className="font-semibold">{day.dateLabel}</div>
            <div className="mt-1 text-xs opacity-80">
              {t("dayFooter", {
                delivered: day.deliveredCount ?? 0,
                paused: day.pausedCount ?? 0,
                skipped: day.skippedCount ?? 0,
              })}
            </div>
          </>
        )}
      />
    </div>
  );
}
