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
    const finalStatus = type === "EXTRA" ? "DELIVERED" : type;
    setLoadingKey(`${customerCode}:${type}`);

    // Optimistic update
    setLocalEntries((prev) =>
      prev.map((entry) => {
        if (entry.customerCode !== customerCode) return entry;

        if (type === "RESET") {
          return { ...entry, status: "PENDING" as const, actualQuantity: entry.defaultQuantity, extraQuantity: 0 };
        }

        const statusToSet = isTogglingOff ? "PENDING" : (type === "EXTRA" ? "DELIVERED" : type);
        return { ...entry, status: statusToSet as any };
      })
    );

    try {
      if (isTogglingOff) {
        await fetch(`/api/deliveries?customerCode=${customerCode}&date=${filters.date}`, {
          method: "DELETE",
        });
      } else {
        const currentEntry = localEntries.find(e => e.customerCode === customerCode);
        const body: any = {
          customerCode,
          status: finalStatus,
          date: filters.date,
          actualQuantity: currentEntry?.actualQuantity ?? currentEntry?.defaultQuantity ?? 0,
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

    // Optimistic update
    setLocalEntries(prev => prev.map(e => e.status === "PENDING" ? { ...e, status: "DELIVERED" } : e));

    try {
      await Promise.all(pending.map(e =>
        fetch("/api/deliveries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerCode: e.customerCode,
            status: "DELIVERED",
            date: filters.date,
            actualQuantity: e.actualQuantity || e.defaultQuantity || 0
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

  return (
    <AdminCard className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[var(--admin-primary-strong)]" />
            <h2 className="text-xl font-bold text-[var(--admin-text)] tracking-tight">Delivery Run</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)] font-medium">
            {selectedAreaName} · <span className="text-[var(--admin-text)] font-bold">{counts.pending}</span> pending of {counts.total}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <AdminButton
            variant="secondary"
            onClick={markAllDelivered}
            disabled={counts.pending === 0 || loadingKey !== null}
            className="w-full sm:w-auto"
          >
            {loadingKey === "all:DELIVERED" ? "Processing..." : "Mark All Delivered"}
          </AdminButton>
          <AdminButton onClick={openLocationSelector} className="w-full sm:w-auto shadow-lg shadow-blue-100">
            <Play className="h-4 w-4" />
            {filters.area ? "Change Route" : "Start Route"}
          </AdminButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 bg-white/50 p-4 rounded-[24px] border border-[var(--admin-border)]">
        <AdminField label="Date">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <AdminInput
              type="date"
              value={filters.date}
              onChange={(event) => updateFilters({ date: event.target.value })}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </AdminField>
        <AdminField label="Status Filter">
          <AdminSelect
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value as DeliveryStatus })}
            className="h-11 rounded-xl"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Route Selection">
          <AdminSelect
            value={filters.area}
            onChange={(event) => updateFilters({ area: event.target.value })}
            className="h-11 rounded-xl"
          >
            <option value="">All locations</option>
            {areas.map((area) => (
              <option key={area.code} value={area.code}>
                {typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[22px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">D</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{counts.delivered}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-100/50 text-emerald-600">
              <Check className="h-5 w-5 stroke-[3]" />
            </div>
          </div>
        </div>
        <div className="bg-rose-50/50 border border-rose-100 rounded-[22px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">S</p>
              <p className="mt-1 text-2xl font-black text-rose-700">{counts.skipped}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-100/50 text-rose-600">
              <X className="h-5 w-5 stroke-[3]" />
            </div>
          </div>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 rounded-[22px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">P</p>
              <p className="mt-1 text-2xl font-black text-amber-700">{counts.paused}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-100/50 text-amber-600">
              <Pause className="h-5 w-5 stroke-[3]" />
            </div>
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-[22px] px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Pending</p>
              <p className="mt-1 text-2xl font-black text-blue-700">{counts.pending}</p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-100/50 text-blue-600">
              <Clock className="h-5 w-5 stroke-[3]" />
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
                "admin-panel rounded-[24px] px-4 py-5 md:px-6 md:py-6 transition-all duration-300 border border-transparent",
                isDelivered ? "bg-[#f0fdf4] border-emerald-100/50" : "bg-white hover:border-gray-200",
                !isPending && "opacity-95 shadow-sm"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Info Section (Left) */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl transition-colors",
                      isDelivered ? "bg-emerald-100 text-emerald-600" :
                        isSkipped ? "bg-rose-100 text-rose-600" :
                          isPaused ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {isDelivered ? <Check className="h-5 w-5" /> :
                        isSkipped ? <X className="h-5 w-5" /> :
                          isPaused ? <Pause className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-[var(--admin-text)] tracking-tight">
                        {task.customerName}
                      </h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        📍 {task.route}
                      </p>
                    </div>
                    <AdminBadge tone={getStatusTone(task.status)} className="text-[10px] font-black uppercase h-5 px-2 ml-auto md:ml-0">
                      {task.status === "DELIVERED" ? "D" : task.status === "SKIPPED" ? "S" : task.status === "PAUSED" ? "P" : task.status}
                    </AdminBadge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {task.extraQuantity !== 0 && task.extraQuantity !== undefined && (
                      <span className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                        (task.extraQuantity || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {(task.extraQuantity || 0) > 0 ? "+" : ""}{(task.extraQuantity || 0).toFixed(1)}L
                      </span>
                    )}
                    {task.deliveryInstruction && (
                      <p className="text-[11px] font-medium text-[var(--admin-primary-strong)] italic">
                        "{task.deliveryInstruction}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Controls Section (Right) */}
                <div className="flex flex-col items-end gap-4 shrink-0">

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100 shadow-sm w-full md:w-auto justify-between md:justify-start">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(task.customerCode, -0.5)}
                      disabled={(task.actualQuantity || 0) <= 0}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:text-rose-500 transition-colors active:scale-90",
                        (task.actualQuantity || 0) <= 0 && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <Minus className="h-3 w-3 stroke-[3]" />
                    </button>
                    <div className="px-4 min-w-[70px] text-center">
                      <span className="text-base font-black text-[var(--admin-text)]">
                        {(task.actualQuantity || 0).toFixed(1)}L
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(task.customerCode, 0.5)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:text-emerald-500 transition-colors active:scale-90"
                    >
                      <Plus className="h-3 w-3 stroke-[3]" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isDelivered ? "RESET" : "DELIVERED", task.status)}
                      disabled={loadingKey !== null}
                      className={cn(
                        "flex-1 md:flex-none flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl font-bold transition-all active:scale-95",
                        isDelivered
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                          : cn(
                            "bg-emerald-50 text-emerald-700 border border-emerald-100",
                            !isPending && "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                    >
                      {loadingKey === `${task.customerCode}:DELIVERED` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4 stroke-[3]" />
                      )}
                      <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Deliver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isSkipped ? "RESET" : "SKIPPED", task.status)}
                      disabled={loadingKey !== null}
                      className={cn(
                        "flex-1 md:flex-none flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl font-bold transition-all active:scale-95",
                        isSkipped
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-100"
                          : cn(
                            "bg-rose-50 text-rose-700 border border-rose-100",
                            !isPending && "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                    >
                      {loadingKey === `${task.customerCode}:SKIPPED` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X className="h-4 w-4 stroke-[3]" />
                      )}
                      <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Skip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saveStatus(task.customerCode, isPaused ? "RESET" : "PAUSED", task.status)}
                      disabled={loadingKey !== null}
                      className={cn(
                        "flex-1 md:flex-none flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl font-bold transition-all active:scale-95",
                        isPaused
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-100"
                          : cn(
                            "bg-amber-50 text-amber-700 border border-amber-100",
                            !isPending && "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                          )
                      )}
                    >
                      {loadingKey === `${task.customerCode}:PAUSED` ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Pause className="h-4 w-4 stroke-[3]" />
                      )}
                      <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Pause</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {isLocationOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/35 p-3 sm:items-center sm:justify-center">
          <div className="admin-panel w-full max-w-lg rounded-[24px] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                  Select route location
                </h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Pick one area to load only its customers for the morning run.
                </p>
              </div>
              <button
                type="button"
                className="admin-secondary-button h-9 w-9 p-0"
                onClick={() => setIsLocationOpen(false)}
                aria-label="Close location selector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
              {isLoadingLocations ? (
                <div className="admin-panel-muted rounded-[16px] px-4 py-3 text-sm text-[var(--admin-muted)]">
                  Loading locations...
                </div>
              ) : null}
              {locationError ? (
                <div className="rounded-[16px] border border-[var(--admin-border)] bg-white px-4 py-3 text-sm text-[var(--admin-muted)]">
                  {locationError}
                </div>
              ) : null}
              <button
                type="button"
                className="admin-secondary-button justify-between px-4 py-3 text-left text-sm font-semibold"
                onClick={() => selectLocation("")}
              >
                <span>All locations</span>
                <MapPin className="h-4 w-4" />
              </button>
              {locationOptions.map((area) => (
                <button
                  key={area.code}
                  type="button"
                  className="admin-secondary-button justify-between px-4 py-3 text-left text-sm font-semibold"
                  onClick={() => selectLocation(area.code)}
                >
                  <span>{typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}</span>
                  <MapPin className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AdminCard>
  );
}
