"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, CirclePause, CirclePlay, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminBadge, AdminDivider } from "@/components/layout/admin-ui";

type CustomerSchedulePopoverProps = {
  isOpen: boolean;
  onClose: () => void;
  customerCode: string;
  onViewFull: () => void;
};

export function CustomerSchedulePopover({
  isOpen,
  onClose,
  customerCode,
  onViewFull
}: CustomerSchedulePopoverProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/customers/${customerCode}`)
        .then((res) => res.json())
        .then((resData) => {
          setData(resData.customer);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, customerCode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const exceptions = data?.exceptions || [];
  const activePause = exceptions.find((ex: any) => ex.type === "PAUSE");
  const resumeDate = exceptions.find((ex: any) => ex.type === "RESUME")?.date;

  return (
    <div 
      ref={popoverRef}
      className="absolute right-0 top-full z-[100] mt-2 w-64 origin-top-right overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in duration-200 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-[var(--admin-primary)]" />
          <h4 className="text-sm font-bold text-[var(--admin-text)]">Delivery Schedule</h4>
        </div>

        <AdminDivider className="my-2 opacity-50" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--admin-muted)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">Loading...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePause ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <CirclePause className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Paused</span>
                </div>
                <p className="text-xs font-bold text-amber-900">
                  {new Date(activePause.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {resumeDate && (
                  <div className="mt-2 pt-2 border-t border-amber-100/50">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <CirclePlay className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Resuming</span>
                    </div>
                    <p className="text-xs font-bold text-emerald-900">
                      {new Date(resumeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CirclePlay className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
                </div>
                <p className="text-xs font-bold text-emerald-900 italic">No upcoming pauses</p>
                <p className="text-[10px] text-emerald-700/70 mt-1">Delivery runs as per plan</p>
              </div>
            )}

            <button
              onClick={() => {
                onClose();
                onViewFull();
              }}
              className="w-full mt-1 flex items-center justify-center gap-1 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--admin-primary)] transition hover:bg-blue-50 rounded-lg"
            >
              View Full Details →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
