"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AdminModal } from "@/components/layout/admin-modal";
import { MonthGrid } from "@/components/calendar/month-grid";
import { AdminButton } from "@/components/layout/admin-ui";

type CustomerCalendarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    customerCode: string;
    name: string;
  } | null;
};

export function CustomerCalendarModal({
  isOpen,
  onClose,
  customer,
}: CustomerCalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      fetchCalendarData(currentDate.getMonth() + 1, currentDate.getFullYear());
    }
  }, [isOpen, customer, currentDate]);

  const fetchCalendarData = async (month: number, year: number) => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.customerCode}/calendar?month=${month}&year=${year}`);
      const data = await res.json();
      setCalendarData(data);
    } catch (error) {
      console.error("Failed to fetch calendar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(nextDate);
  };

  if (!customer) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${customer.name}'s Delivery History`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
             <h3 className="text-lg font-black text-[var(--admin-text)]">
               {calendarData?.monthLabel || "Loading..."}
             </h3>
             <p className="text-[10px] font-bold text-[var(--admin-muted)] uppercase tracking-widest">
               Delivery Calendar
             </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white text-[var(--admin-text)] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-white text-[var(--admin-text)] shadow-sm transition hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center rounded-2xl bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
          </div>
        ) : calendarData ? (
          <div className="modal-calendar-container rounded-2xl bg-white p-1 sm:p-2 border border-[var(--admin-border)] shadow-sm">
            <MonthGrid
              monthLabel={calendarData.monthLabel}
              leadingBlankSlots={calendarData.leadingBlankSlots}
              days={calendarData.days}
              variant="customer"
              showLegend={true}
              isMinimal={true}
            />
          </div>
        ) : null}

        <div className="flex justify-end pt-1">
          <AdminButton variant="secondary" onClick={onClose} className="px-6 py-2 h-9 text-sm">
            Done
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  );
}
