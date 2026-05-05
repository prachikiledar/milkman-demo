"use client";

import { CalendarDays, UserRound } from "lucide-react";
import { AdminBadge } from "@/components/layout/admin-ui";
import { cn, formatCurrencyINR } from "@/lib/utils";
import { CustomerCardActions } from "./customer-card-actions";

type CalendarDay = {
  dateKey: string;
  dateLabel: string;
  dayOfMonth: number;
  weekdayLabel: string;
  liters: number;
  status: "DELIVERED" | "SKIPPED" | "PAUSED" | "PENDING";
  isFuture: boolean;
};

type CustomerListItemProps = {
  customer: {
    id: string;
    customerCode: string;
    name: string;
    phone: string;
    areaName: string;
    quantity: number;
    due: number;
    lastPaymentDate: Date | null;
    status: string;
    calendarData?: {
      monthLabel: string;
      leadingBlankSlots: number;
      days: CalendarDay[];
    };
  };
  locale: string;
  tDue: string;
  onView?: (mode: "view" | "details" | "edit" | "schedule" | "calendar") => void;
  isMenuOpen: boolean;
  setMenuOpen: (isOpen: boolean) => void;
};

export function CustomerListItem({
  customer,
  locale,
  tDue,
  onView,
  isMenuOpen,
  setMenuOpen,
}: CustomerListItemProps) {
  const formatDateShort = (date: Date | null) => {
    if (!date) return "n/a";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
    }).format(new Date(date));
  };

  return (
    <article
      className={cn(
        "admin-panel rounded-[22px] px-4 py-4 transition relative group",
        isMenuOpen ? "z-[60]" : "z-10",
        "hover:bg-white active:scale-[0.995]"
      )}
    >
      {/* Clickable Overlay for Details (Default to 'view') */}
      <div
        onClick={() => onView?.("view")}
        className="absolute inset-0 z-0 h-full w-full cursor-pointer"
        aria-label="View details"
      />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pointer-events-none">
        {/* 1. Customer Info */}
        <div className="flex items-center gap-3 sm:min-w-[250px]">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)] sm:flex">
            <UserRound className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold text-[var(--admin-text)] text-[15px]">{customer.name}</h3>
              <AdminBadge tone={customer.status === "ACTIVE" ? "success" : "blue"} className="text-[9px] uppercase h-4 px-1.5 leading-none font-bold">
                {customer.status}
              </AdminBadge>
            </div>
            <p className="text-[12px] text-gray-500 font-medium truncate mt-0.5">
              {customer.areaName} • <span className="text-[var(--admin-primary-strong)] font-bold">{customer.quantity.toFixed(1)}L</span>
            </p>
          </div>
        </div>

        {/* 2. Middle Space (Empty) */}
        <div className="flex-1 hidden sm:block" />

        {/* 3. Due & Actions Section (Right) */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pointer-events-auto sm:min-w-[200px]">
          <div className="flex flex-col items-start mr-3">
            <p
              className={cn(
                "text-[15px] font-black tracking-tight",
                customer.due > 500 ? "text-[#e11d48]" : "text-[var(--admin-text)]"
              )}
            >
              {formatCurrencyINR(customer.due)}
            </p>
            <p className="text-[10px] font-bold uppercase text-gray-400 mt-0.5">
              {tDue} <span className="mx-1 text-gray-300">•</span>
              <span className="text-gray-500 lowercase first-letter:uppercase">paid: {formatDateShort(customer.lastPaymentDate)}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 flex-nowrap">
            {/* Calendar Icon - Opens Modal */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.('calendar');
              }}
              className="flex items-center justify-center h-11 w-11 rounded-2xl bg-white border border-gray-100 shadow-sm text-blue-600 hover:bg-blue-50 transition-all active:scale-95 group"
              title="View Delivery Calendar"
            >
              <CalendarDays className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>

            <CustomerCardActions
              id={customer.id}
              customerCode={customer.customerCode}
              isMenuOpen={isMenuOpen}
              setMenuOpen={setMenuOpen}
              locale={locale}
              onView={onView}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
