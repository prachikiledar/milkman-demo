"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock, Filter, MapPin, Minus, Pause, Play, Plus, X } from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
} from "@/components/layout/admin-ui";
import { AdminModal } from "@/components/layout/admin-modal";
import { cn, formatCurrencyINR } from "@/lib/utils";

type DeliveryStatus = "ALL" | "DELIVERED" | "SKIPPED" | "PAUSED" | "PENDING";

type DeliveryEntry = {
  customerCode: string;
  customerName: string;
  quantityLabel: string;
  status: Exclude<DeliveryStatus, "ALL">;
  route: string;
  areaCode: string;
  deliveryInstruction?: string;
  defaultQuantity: number;
  extraQuantity: number;
  actualQuantity: number;
};

type DeliveryOperationsPanelProps = {
  entries: DeliveryEntry[];
  areas: Array<{ code: string; name: string | { en: string; hi: string; pa: string } }>;
  counts: {
    delivered: number;
    skipped: number;
    paused: number;
    pending: number;
    total: number;
  };
  filters: {
    date: string;
    area: string;
    status: DeliveryStatus;
  };
  locale: string;
  startRun: boolean;
};

const statusOptions: Array<{ value: DeliveryStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "SKIPPED", label: "Skipped" },
  { value: "PAUSED", label: "Paused" },
  { value: "PENDING", label: "Pending" },
];

function getStatusTone(status: DeliveryEntry["status"]) {
  if (status === "DELIVERED") return "success";
  if (status === "PAUSED") return "warning";
  if (status === "SKIPPED") return "danger";
  return "blue";
}

export function DeliveryOperationsPanel({
  entries,
  areas,
  counts,
  filters,
  locale,
  startRun,
}: DeliveryOperationsPanelProps) {
  const router = useRouter();
  const [localEntries, setLocalEntries] = useState(entries);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(startRun);
  const [locationOptions, setLocationOptions] = useState(areas);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationError, setLocationError] = useState("");

  const STATUS_PRIORITY: Record<string, number> = {
    PENDING: 1,
    PAUSED: 2,
    SKIPPED: 3,
    DELIVERED: 4,
  };

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...localEntries].sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 5;
      const pB = STATUS_PRIORITY[b.status] || 5;
      if (pA !== pB) return pA - pB;
      return a.customerName.localeCompare(b.customerName);
    });
  }, [localEntries]);

  const selectedAreaName = useMemo(() => {
    const area = areas.find((a) => a.code === filters.area);
    if (!area) return "All locations";
    return typeof area.name === "string"
      ? area.name
      : area.name[locale as keyof typeof area.name] || area.name.en;
  }, [areas, filters.area, locale]);

  useEffect(() => {
    if (startRun) {
      openLocationSelector();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRun]);

  function updateFilters(nextFilters: Partial<typeof filters>) {
    const params = new URLSearchParams();
    const next = { ...filters, ...nextFilters };

    if (next.date) params.set("date", next.date);
    if (next.area) params.set("area", next.area);
    if (next.status !== "ALL") params.set("status", next.status);

    router.push(`/${locale}/admin/deliveries?${params.toString()}`);
  }

  async function openLocationSelector() {
    setIsLocationOpen(true);
    setLocationError("");
    setIsLoadingLocations(true);

    try {
      const response = await fetch("/api/areas", { cache: "no-store" });
      const data = (await response.json()) as {
        areas?: Array<{ code: string; name: string | { en: string; hi: string; pa: string }; isActive?: boolean }>;
      };
      const areaPayload: Array<{
        code: string;
        name: string | { en: string; hi: string; pa: string };
        isActive?: boolean;
      }> = data.areas || (areas as any);
      const activeAreas = areaPayload
        .filter((area) => area.isActive !== false)
        .map((area) => ({ code: area.code, name: area.name }));
      setLocationOptions(activeAreas);
    } catch {
      setLocationError("Unable to load locations. Showing cached locations.");
      setLocationOptions(areas);
    } finally {
      setIsLoadingLocations(false);
    }
  }

  function selectLocation(areaCode: string) {
    if (areaCode) {
      window.localStorage.setItem("milkman:last-area", areaCode);
    }
    setIsLocationOpen(false);
    updateFilters({ area: areaCode, status: "ALL" });
  }

  const handleQuantityChange = (customerCode: string, delta: number) => {
    setLocalEntries((prev) =>
      prev.map((entry) => {
        if (entry.customerCode === customerCode) {
          const currentActual = Number(entry.actualQuantity || 0);
          const newActual = Math.max(0, currentActual + delta);

          return {
            ...entry,
            actualQuantity: newActual,
            extraQuantity: newActual - entry.defaultQuantity,
          };
        }
        return entry;
      }),
    );
  };

  async function saveStatus(
    customerCode: string,
    type: "DELIVERED" | "SKIPPED" | "PAUSED" | "EXTRA" | "RESET",
    currentStatus: string
  ) {
    const isTogglingOff = type === "RESET" || currentStatus === type;
    const apiStatus = type === "EXTRA" ? "DELIVERED" : (type === "RESET" ? null : type) as "DELIVERED" | "SKIPPED" | "PAUSED" | null;
    setLoadingKey(`${customerCode}:${type}`);

    // Optimistic update
    setLocalEntries((prev) =>
      prev.map((entry) => {
        if (entry.customerCode !== customerCode) return entry;
        if (isTogglingOff) {
          return { ...entry, status: "PENDING" as const, actualQuantity: entry.defaultQuantity, extraQuantity: 0 };
        }
        const statusToSet = type === "EXTRA" ? "DELIVERED" : type;
        return { ...entry, status: statusToSet as any };
      })
    );

    try {
      if (isTogglingOff) {
        await fetch(`/api/deliveries?customerCode=${customerCode}&date=${filters.date}`, {
          method: "DELETE",
        });
      } else if (apiStatus) {
        const currentEntry = localEntries.find(e => e.customerCode === customerCode);
        const body = {
          customerCode,
          status: apiStatus,
          date: filters.date,
          actualQuantity: currentEntry?.actualQuantity ?? currentEntry?.defaultQuantity ?? 0,
          extraQuantity: currentEntry?.extraQuantity || 0,
        };

        await fetch("/api/deliveries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to save status:", error);
      setLocalEntries(entries);
    } finally {
      setLoadingKey(null);
    }
  }

  async function markAllDelivered() {
    const pending = localEntries.filter(e => e.status === "PENDING");
    if (pending.length === 0) return;

    setLoadingKey("all:DELIVERED");
    setLocalEntries(prev => prev.map(e => e.status === "PENDING" ? { ...e, status: "DELIVERED" as const } : e));

    try {
      await Promise.all(pending.map(e =>
        fetch("/api/deliveries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode: e.customerCode,
            status: "DELIVERED",
            date: filters.date,
            actualQuantity: e.actualQuantity || e.defaultQuantity || 0,
            extraQuantity: e.extraQuantity || 0,
          }),
        })
      ));
      router.refresh();
    } catch (error) {
      console.error(error);
      setLocalEntries(entries);
    } finally {
      setLoadingKey(null);
    }
  }

  async function markAllUndelivered() {
    const delivered = localEntries.filter(e => e.status === "DELIVERED");
    if (delivered.length === 0) return;

    setLoadingKey("all:UNDELIVERED");

    // Optimistic update
    setLocalEntries(prev => prev.map(e => e.status === "DELIVERED" ? { ...e, status: "PENDING" } : e));

    try {
      await Promise.all(delivered.map(e =>
        fetch(`/api/deliveries?customerCode=${e.customerCode}&date=${filters.date || ""}`, {
          method: "DELETE",
        })
      ));
      router.refresh();
    } catch (error) {
      console.error(error);
      setLocalEntries(entries);
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center">
              <Filter className="h-4 w-4 text-[#064e3b]" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Delivery Run</h2>
          </div>
          <p className="mt-2 text-sm text-gray-500 font-medium ml-13 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">{selectedAreaName}</span>
            <span>·</span>
            <span className="text-gray-900 font-bold">{counts.pending}</span> pending of {counts.total}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          {counts.pending === 0 && counts.delivered > 0 ? (
            <button
              type="button"
              onClick={markAllUndelivered}
              disabled={loadingKey !== null}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loadingKey === "all:UNDELIVERED" ? "Processing..." : "Mark All Undelivered"}
            </button>
          ) : (
            <button
              type="button"
              onClick={markAllDelivered}
              disabled={counts.pending === 0 || loadingKey !== null}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loadingKey === "all:DELIVERED" ? "Processing..." : "Mark All Delivered"}
            </button>
          )}
          <button
            type="button"
            onClick={openLocationSelector}
            style={{ background: 'linear-gradient(to right, #064e3b, #166534)' }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black shadow-[0_4px_12px_rgba(6,78,59,0.3)] hover:shadow-[0_6px_16px_rgba(6,78,59,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Play className="h-4 w-4 fill-white" />
            {filters.area ? "Change Route" : "Start Route"}
          </button>
        </div>
      </div>

      {/* Sleek Glassmorphic Filter Bar */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 bg-white/60 backdrop-blur-xl p-3 rounded-[20px] border border-white/40 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 pl-1">Date</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filters.date}
              onChange={(event) => updateFilters({ date: event.target.value })}
              className="w-full pl-10 h-9 rounded-lg border-none bg-white shadow-sm text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 pl-1">Status Filter</label>
          <select
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value as DeliveryStatus })}
            className="w-full px-3 h-9 rounded-lg border-none bg-white shadow-sm text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 col-span-2 md:col-span-1">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 pl-1">Route Selection</label>
          <select
            value={filters.area}
            onChange={(event) => updateFilters({ area: event.target.value })}
            className="w-full px-3 h-9 rounded-lg border-none bg-white shadow-sm text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 transition-all appearance-none"
          >
            <option value="">All locations</option>
            {areas.map((area) => (
              <option key={area.code} value={area.code}>
                {typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Premium Dashboard Style Metrics */}
      <div className="flex sm:grid sm:grid-cols-4 gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Delivered Card */}
        <div className="min-w-[120px] w-[35vw] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-[#ecfdf5] to-white border border-[#d1fae5] rounded-[20px] p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#d1fae5]/50 rounded-full blur-xl group-hover:bg-[#a7f3d0]/50 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#059669] mb-1">Delivered</p>
              <p className="text-xl font-black tracking-tighter text-[#064e3b]">{counts.delivered}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#10b981] shadow-[0_2px_8px_rgba(16,185,129,0.3)] text-white transform group-hover:scale-105 transition-transform shrink-0">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Skipped Card */}
        <div className="min-w-[120px] w-[35vw] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-[#fff1f2] to-white border border-[#ffe4e6] rounded-[20px] p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#ffe4e6]/50 rounded-full blur-xl group-hover:bg-[#fecdd3]/50 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#e11d48] mb-1">Skipped</p>
              <p className="text-xl font-black tracking-tighter text-[#881337]">{counts.skipped}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#f43f5e] shadow-[0_2px_8px_rgba(244,63,94,0.3)] text-white transform group-hover:scale-105 transition-transform shrink-0">
              <X className="h-4 w-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Paused Card */}
        <div className="min-w-[120px] w-[35vw] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-[#fffbeb] to-white border border-[#fef3c7] rounded-[20px] p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#fef3c7]/50 rounded-full blur-xl group-hover:bg-[#fde68a]/50 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#d97706] mb-1">Paused</p>
              <p className="text-xl font-black tracking-tighter text-[#78350f]">{counts.paused}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#f59e0b] shadow-[0_2px_8px_rgba(245,158,11,0.3)] text-white transform group-hover:scale-105 transition-transform shrink-0">
              <Pause className="h-4 w-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="min-w-[120px] w-[35vw] sm:w-auto shrink-0 snap-start bg-gradient-to-br from-[#064e3b] via-[#053e2f] to-[#021f16] border border-[#14532d]/50 rounded-[20px] p-3 shadow-lg shadow-[#14532d]/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#4ade80]/20 rounded-full blur-xl group-hover:bg-[#4ade80]/30 transition-all" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#86efac] mb-1 drop-shadow-md">Pending</p>
              <p className="text-xl font-black tracking-tighter text-white drop-shadow-lg">{counts.pending}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transform group-hover:scale-105 transition-transform shadow-sm shrink-0">
              <Clock className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="admin-panel-muted rounded-[24px] px-4 py-12 text-center border-2 border-dashed border-gray-200">
            <MapPin className="mx-auto h-10 w-10 text-[var(--admin-primary-strong)] opacity-50" />
            <h3 className="mt-4 text-lg font-bold text-[var(--admin-text)]">
              {counts.total === 0 && filters.area
                ? "No customers on this route"
                : "No matching deliveries"}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--admin-muted)]">
              Check filters or select another location to start marking.
            </p>
          </div>
        ) : null}

        {sortedEntries.map((task) => {
          const isDelivered = task.status === "DELIVERED";
          const isSkipped = task.status === "SKIPPED";
          const isPaused = task.status === "PAUSED";
          const isPending = task.status === "PENDING";

          return (
            <article
              key={task.customerCode}
              className={cn(
                "bg-white rounded-[20px] p-3 sm:px-5 sm:py-4 transition-all duration-300 border mb-3 cursor-default hover:border-gray-200 hover:shadow-sm",
                isDelivered ? "bg-gradient-to-r from-[#ecfdf5]/80 to-white border-[#d1fae5] hover:border-[#a7f3d0]" : "border-gray-100",
                !isPending && "opacity-90 grayscale-[0.1]"
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                
                {/* User Info */}
                <div className="flex items-center gap-4 min-w-0 md:w-[35%]">
                  <div className={cn(
                    "h-8 w-8 shrink-0 flex items-center justify-center rounded-xl transition-colors shadow-sm",
                    isDelivered ? "bg-[#10b981] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]" :
                      isSkipped ? "bg-[#f43f5e] text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]" :
                        isPaused ? "bg-[#f59e0b] text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]" : "bg-gray-100 text-gray-500"
                  )}>
                    {isDelivered ? <Check className="h-4 w-4 stroke-[3]" /> :
                      isSkipped ? <X className="h-4 w-4 stroke-[3]" /> :
                        isPaused ? <Pause className="h-4 w-4 stroke-[3]" /> : <MapPin className="h-4 w-4 stroke-[2.5]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[13px] font-bold text-gray-900 tracking-tight">
                        {task.customerName}
                      </h2>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0",
                        isDelivered ? "bg-[#d1fae5] text-[#047857]" :
                        isSkipped ? "bg-[#ffe4e6] text-[#be123c]" :
                        isPaused ? "bg-[#fef3c7] text-[#b45309]" : "bg-gray-100 text-gray-600"
                      )}>
                        {task.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate mt-1 block">
                      📍 {task.route}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex justify-center md:justify-center md:w-[25%] mt-2 md:mt-0">
                  <div className="flex items-center bg-gray-50/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 shadow-inner w-auto justify-center">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(task.customerCode, -0.5)}
                      disabled={(task.actualQuantity || 0) <= 0}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm border border-gray-100 hover:text-[#f43f5e] hover:border-[#ffe4e6] transition-all active:scale-90",
                        (task.actualQuantity || 0) <= 0 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Minus className="h-3 w-3 stroke-[3]" />
                    </button>
                    <div className="px-3 min-w-[52px] shrink-0 text-center">
                      <span className="text-sm font-black text-gray-900 tracking-tighter">
                        {(task.actualQuantity || 0).toFixed(1)}L
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(task.customerCode, 0.5)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm border border-gray-100 hover:text-[#10b981] hover:border-[#d1fae5] transition-all active:scale-90"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Instructions & Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  {task.deliveryInstruction && (
                    <div className="hidden xl:block max-w-[130px] mr-auto">
                      <p className="text-[10px] font-bold text-[#064e3b] italic leading-tight bg-[#ecfdf5] px-2 py-1.5 rounded-lg truncate">
                        "{task.deliveryInstruction}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isDelivered ? "RESET" : "DELIVERED", task.status)}
                      disabled={loadingKey !== null}
                      style={isDelivered ? { backgroundColor: '#10b981', color: 'white' } : undefined}
                      className={cn(
                        "flex items-center justify-center gap-1 h-9 px-3 rounded-xl font-bold transition-all active:scale-95 text-[10px] uppercase tracking-widest",
                        isDelivered
                          ? "shadow-[0_4px_10px_rgba(16,185,129,0.3)]"
                          : cn(
                            "bg-white border-2 border-[#d1fae5] text-[#10b981] hover:bg-[#ecfdf5] hover:border-[#a7f3d0]",
                            !isPending && "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                    >
                      {loadingKey === `${task.customerCode}:DELIVERED` ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          {isDelivered ? "Delivered" : "Deliver"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isSkipped ? "RESET" : "SKIPPED", task.status)}
                      disabled={loadingKey !== null}
                      style={isSkipped ? { backgroundColor: '#f43f5e', color: 'white' } : undefined}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl font-black transition-all active:scale-95 shrink-0",
                        isSkipped
                          ? "shadow-[0_4px_10px_rgba(244,63,94,0.3)]"
                          : cn(
                            "bg-white border-2 border-gray-100 text-gray-400 hover:bg-[#fff1f2] hover:border-[#ffe4e6] hover:text-[#e11d48]",
                            !isPending && "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                      aria-label="Skip"
                    >
                      {loadingKey === `${task.customerCode}:SKIPPED` ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X className="h-3.5 w-3.5 stroke-[3]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isPaused ? "RESET" : "PAUSED", task.status)}
                      disabled={loadingKey !== null}
                      style={isPaused ? { backgroundColor: '#f59e0b', color: 'white' } : undefined}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl font-black transition-all active:scale-95 shrink-0",
                        isPaused
                          ? "shadow-[0_4px_10px_rgba(245,158,11,0.3)]"
                          : cn(
                            "bg-white border-2 border-gray-100 text-gray-400 hover:bg-[#fffbeb] hover:border-[#fef3c7] hover:text-[#d97706]",
                            !isPending && "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                      aria-label="Pause"
                    >
                      {loadingKey === `${task.customerCode}:PAUSED` ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Pause className="h-3.5 w-3.5 stroke-[3]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Mobile instruction view */}
              {task.deliveryInstruction && (
                <div className="xl:hidden mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-[#064e3b] italic leading-tight bg-[#ecfdf5] px-2 py-1.5 rounded-lg inline-block">
                    "{task.deliveryInstruction}"
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <AdminModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        title="Select Route"
      >
        <div className="grid gap-3">
          <p className="text-sm text-gray-500 font-medium mb-2">
            Pick an area to load its customers for the morning run.
          </p>

          {isLoadingLocations && (
            <div className="rounded-[16px] px-5 py-4 text-sm font-bold text-gray-500 bg-gray-50 text-center animate-pulse">
              Loading locations...
            </div>
          )}
          
          {locationError && (
            <div className="rounded-[16px] bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600">
              {locationError}
            </div>
          )}
          
          <button
            type="button"
            className="flex items-center justify-between px-5 py-4 rounded-[16px] bg-white border border-gray-100 hover:bg-gray-50 text-left text-sm font-black text-gray-700 transition-colors group"
            onClick={() => selectLocation("")}
          >
            <span>All locations</span>
            <MapPin className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {locationOptions.map((area) => (
            <button
              key={area.code}
              type="button"
              className="flex items-center justify-between px-5 py-4 rounded-[16px] bg-white border border-gray-100 hover:bg-gray-50 text-left text-sm font-black text-gray-700 transition-colors group"
              onClick={() => selectLocation(area.code)}
            >
              <span>{typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}</span>
              <MapPin className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          ))}
        </div>
      </AdminModal>
    </div >
  );
}
