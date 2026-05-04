"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Info, MinusCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarDayRecord } from "@/lib/calendar";

type DashboardCalendarProps = {
  monthLabel: string;
  leadingBlankSlots: number;
  days: CalendarDayRecord[];
};

const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

export function DashboardCalendar({
  monthLabel,
  leadingBlankSlots,
  days,
}: DashboardCalendarProps) {
  const t = useTranslations();
  const [selectedDay, setSelectedDay] = useState<CalendarDayRecord | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const getDayStatusColor = (day: CalendarDayRecord) => {
    if (day.isFuture) return "bg-gray-50 text-gray-300 border-gray-100"; // Upcoming
    if (day.status === "PAUSED") return "bg-amber-50 text-amber-600 border-amber-100"; // Paused
    if (day.status === "SKIPPED") return "bg-rose-50 text-rose-600 border-rose-100"; // Skipped
    if (day.status === "DELIVERED") return "bg-emerald-50 text-emerald-600 border-emerald-100"; // Delivered
    return "bg-white text-gray-700 border-gray-200";
  };

  const hasUpcomingPauses = days.some(d => d.isFuture && d.status === "PAUSED");

  return (
    <div className="w-full space-y-6">
      {/* Main Calendar Grid */}
      <section className="w-full bg-white rounded-[32px] border-2 border-[var(--mint)] p-5 shadow-sm overflow-hidden">
        <h2 className="text-center text-lg font-black text-[var(--mint)] uppercase tracking-widest mb-4">
          {monthLabel.split(" ")[0]} {/* Just "MAY" etc. */}
        </h2>

        <div className="grid grid-cols-7 gap-0 border-b border-gray-100 pb-2 mb-2">
          {weekLabels.map((l, i) => (
            <div key={i} className={cn(
              "text-center text-[13px] font-black py-2",
              i === 0 ? "text-rose-500" : "text-gray-400"
            )}>
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-4">
          {Array.from({ length: leadingBlankSlots }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const isToday = day.dateKey === today;
            const isSelected = selectedDay?.dateKey === day.dateKey;
            const isSunday = new Date(day.dateKey).getDay() === 0;

            return (
              <button
                key={day.dateKey}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "aspect-square rounded-2xl flex items-center justify-center text-base font-black transition-all border-2 relative",
                  getDayStatusColor(day),
                  isToday && "ring-4 ring-[var(--brand)] ring-offset-2 z-20",
                  isSelected && "scale-105 z-10 shadow-lg border-[var(--brand)]",
                  isSunday && !day.isFuture && day.status === "PENDING" && "text-rose-500"
                )}
              >
                {day.dayOfMonth}
                {isToday && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--brand)] rounded-full border-4 border-white shadow-sm"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-gray-50 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-emerald-500"></div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{t("calendar.legend.delivered")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-rose-500"></div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{t("calendar.legend.skipped")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-500"></div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{t("calendar.legend.paused")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-gray-200"></div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{t("status.pending")}</span>
          </div>
        </div>
      </section>

      {/* Selected Day Info (Inline) */}
      {selectedDay && (
        <div className="p-5 rounded-[28px] bg-[var(--brand-soft)] border-2 border-[var(--brand)] animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm",
                selectedDay.status === "DELIVERED" ? "bg-emerald-500" :
                  selectedDay.status === "SKIPPED" ? "bg-rose-500" :
                    selectedDay.status === "PAUSED" ? "bg-amber-500" : "bg-gray-400"
              )}>
                <span className="text-lg font-black">{selectedDay.dayOfMonth}</span>
              </div>
              <div className="stack">
                <span className="text-xs font-black text-[var(--brand-ink)] uppercase tracking-widest">{selectedDay.dateLabel}</span>
                <span className="text-lg font-black text-[var(--brand-ink)]">
                  {selectedDay.status === "PENDING" && selectedDay.isFuture
                    ? t("status.pending")
                    : selectedDay.status === "DELIVERED"
                      ? `${selectedDay.liters.toFixed(1)}L ${t("calendar.legend.delivered")}`
                      : t(`status.${selectedDay.status.toLowerCase()}` as never)
                  }
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="px-4 py-2 bg-white rounded-xl text-xs font-black text-[var(--brand)] uppercase shadow-sm active:scale-95 transition-all"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="stack">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tight">{t("status.today")}</span>
            <span className="text-sm font-black text-gray-900">{t("status.onTrack")}</span>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Info className="h-5 w-5" />
          </div>
          <div className="stack">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-tight">{t("home.hero.pause")}</span>
            <span className="text-sm font-black text-gray-900">{hasUpcomingPauses ? t("status.active") : t("dashboard.noUpdate")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

