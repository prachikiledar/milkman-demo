"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import {
  MessageCircle,
  Phone,
  Plus,
  SquarePen,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
  AdminSelect,
} from "@/components/layout/admin-ui";
import { formatCurrencyINR } from "@/lib/utils";

type VendorRecord = {
  _id: string;
  code: string;
  name: string;
  phone?: string;
  defaultRate?: number;
  areaCode?: string;
  areaName?: string;
  notes?: string;
  isActive?: boolean;
  sortOrder?: number;
  purchaseCount?: number;
  totalPurchaseAmount?: number;
  totalPaid?: number;
  unpaidAmount?: number;
  totalMilkInward?: number;
  lastPurchaseDate?: string;
  averageSupply?: number;
  unpaidEntries?: number;
  lastQuantity?: number;
  lastRate?: number;
};

type MilkLedgerEntry = {
  id: string;
  vendorCode: string;
  vendorName: string;
  date: string;
  dateLabel: string;
  quantity: number;
  rate: number;
  total: number;
  status: "PAID" | "UNPAID";
};

type VendorManagementPanelProps = {
  initialVendors: VendorRecord[];
  areas: Array<{ code: string; name: string | { en: string; hi: string; pa: string } }>;
  locale: string;
};

type VendorFormState = {
  code: string;
  name: string;
  phone: string;
  defaultRate: string;
  areaCode: string;
  notes: string;
  isActive: boolean;
};

type EntryFormState = {
  vendorCode: string;
  date: string;
  quantity: string;
  rate: string;
  status: "PAID" | "UNPAID";
};

const todayDate = new Date().toISOString().slice(0, 10);

function normalizePhone(phone?: string) {
  return (phone || "").replace(/\D/g, "");
}

function getStartingEntryForm(vendor?: VendorRecord | null): EntryFormState {
  const fallbackQuantity =
    vendor?.lastQuantity && vendor.lastQuantity > 0
      ? vendor.lastQuantity
      : vendor?.averageSupply && vendor.averageSupply > 0
        ? Number(vendor.averageSupply.toFixed(1))
        : 0;
  const fallbackRate = vendor?.defaultRate || vendor?.lastRate || 0;

  return {
    vendorCode: vendor?.code || "",
    date: todayDate,
    quantity: fallbackQuantity ? String(fallbackQuantity) : "",
    rate: fallbackRate ? String(fallbackRate) : "",
    status: "UNPAID",
  };
}

function getStartingVendorForm(
  areas: Array<{ code: string; name: string | { en: string; hi: string; pa: string } }>,
  vendor?: VendorRecord | null,
): VendorFormState {
  return {
    code: vendor?.code || "",
    name: vendor?.name || "",
    phone: vendor?.phone || "",
    defaultRate: vendor?.defaultRate ? String(vendor.defaultRate) : "",
    areaCode: vendor?.areaCode || areas[0]?.code || "",
    notes: vendor?.notes || "",
    isActive: vendor?.isActive !== false,
  };
}

export function VendorManagementPanel({ initialVendors, areas, locale }: VendorManagementPanelProps) {
  const router = useRouter();
  const entryQuantityRef = useRef<HTMLInputElement>(null);
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [filterAreaCode, setFilterAreaCode] = useState("ALL");
  const [groupByArea, setGroupByArea] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [entryVendorCode, setEntryVendorCode] = useState<string | null>(null);
  const [ledgerVendorCode, setLedgerVendorCode] = useState<string | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>(() => getStartingVendorForm(areas));
  const [entryForm, setEntryForm] = useState<EntryFormState>(() => getStartingEntryForm(null));
  const [ledgerEntries, setLedgerEntries] = useState<MilkLedgerEntry[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    totalMilk: 0,
    totalAmount: 0,
    totalUnpaid: 0,
  });
  const [ledgerFilters, setLedgerFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const [error, setError] = useState("");
  const [entryError, setEntryError] = useState("");
  const [ledgerError, setLedgerError] = useState("");
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  useEffect(() => {
    if (!entryVendorCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      entryQuantityRef.current?.focus();
      entryQuantityRef.current?.select();
    }, 60);

    return () => window.clearTimeout(timer);
  }, [entryVendorCode]);

  const filteredVendors = vendors.filter((vendor) => {
    if (filterAreaCode === "ALL") {
      return true;
    }

    return vendor.areaCode === filterAreaCode;
  });

  const groupedVendors = groupByArea
    ? filteredVendors.reduce<Array<{ label: string; vendors: VendorRecord[] }>>((groups, vendor) => {
        const label = vendor.areaName || vendor.areaCode || "No area";
        const existing = groups.find((group) => group.label === label);

        if (existing) {
          existing.vendors.push(vendor);
          return groups;
        }

        groups.push({ label, vendors: [vendor] });
        return groups;
      }, [])
    : [{ label: "", vendors: filteredVendors }];

  const selectedVendor = selectedCode
    ? vendors.find((vendor) => vendor.code === selectedCode) || null
    : null;
  const activeEntryVendor = entryVendorCode
    ? filteredVendors.find((vendor) => vendor.code === entryVendorCode) ||
      vendors.find((vendor) => vendor.code === entryVendorCode) ||
      null
    : null;
  const ledgerVendor = ledgerVendorCode
    ? vendors.find((vendor) => vendor.code === ledgerVendorCode) || null
    : null;
  const visibleVendorCodes = filteredVendors.map((vendor) => vendor.code);
  const entryTotal =
    (Number(entryForm.quantity) || 0) * (Number(entryForm.rate) || 0);

  function refreshData() {
    startTransition(() => {
      router.refresh();
    });
  }

  function openNewForm() {
    setSelectedCode(null);
    setVendorForm(getStartingVendorForm(areas));
    setFormVisible(true);
    setError("");
  }

  function openEditForm(vendor: VendorRecord) {
    setSelectedCode(vendor.code);
    setVendorForm(getStartingVendorForm(areas, vendor));
    setFormVisible(true);
    setError("");
  }

  function openEntryFlow(vendor: VendorRecord) {
    setEntryVendorCode(vendor.code);
    setEntryForm(getStartingEntryForm(vendor));
    setEntryError("");
  }

  function closeEntryFlow() {
    setEntryVendorCode(null);
    setEntryForm(getStartingEntryForm(null));
    setEntryError("");
  }

  async function saveVendor() {
    setIsSavingVendor(true);
    setError("");

    try {
      const response = await fetch(
        selectedCode ? `/api/vendors/${selectedCode}` : "/api/vendors",
        {
          method: selectedCode ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...vendorForm,
            defaultRate: Number(vendorForm.defaultRate || 0),
          }),
        },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save vendor");
      }

      setFormVisible(false);
      setSelectedCode(null);
      refreshData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save vendor");
    } finally {
      setIsSavingVendor(false);
    }
  }

  async function deleteVendor() {
    if (!selectedCode) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/vendors/${selectedCode}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete vendor");
      }

      setSelectedCode(null);
      setFormVisible(false);
      refreshData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to delete vendor");
    }
  }

  async function saveMilkEntry(mode: "stay" | "next") {
    if (!activeEntryVendor) {
      return;
    }

    setIsSavingEntry(true);
    setEntryError("");

    try {
      const response = await fetch("/api/milk-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorCode: activeEntryVendor.code,
          date: entryForm.date,
          quantity: Number(entryForm.quantity || 0),
          rate: Number(entryForm.rate || 0),
          status: entryForm.status,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save milk entry");
      }

      if (mode === "next") {
        const currentIndex = visibleVendorCodes.indexOf(activeEntryVendor.code);
        const nextCode = visibleVendorCodes[currentIndex + 1];
        const nextVendor = nextCode
          ? vendors.find((vendor) => vendor.code === nextCode) || null
          : null;

        if (nextVendor) {
          setEntryVendorCode(nextVendor.code);
          setEntryForm(getStartingEntryForm(nextVendor));
        } else {
          closeEntryFlow();
        }
      } else {
        closeEntryFlow();
      }

      if (ledgerVendorCode === activeEntryVendor.code) {
        await loadLedger(activeEntryVendor.code, ledgerFilters.dateFrom, ledgerFilters.dateTo);
      }

      refreshData();
    } catch (submitError) {
      setEntryError(submitError instanceof Error ? submitError.message : "Unable to save milk entry");
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function loadLedger(vendorCode: string, dateFrom = "", dateTo = "") {
    setIsLoadingLedger(true);
    setLedgerError("");

    try {
      const searchParams = new URLSearchParams({ vendorCode });

      if (dateFrom) {
        searchParams.set("dateFrom", dateFrom);
      }

      if (dateTo) {
        searchParams.set("dateTo", dateTo);
      }

      const response = await fetch(`/api/milk-entries?${searchParams.toString()}`);
      const data = (await response.json()) as {
        error?: string;
        entries?: MilkLedgerEntry[];
        summary?: {
          totalMilk: number;
          totalAmount: number;
          totalUnpaid: number;
        };
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load ledger");
      }

      const entries = data.entries || [];
      setLedgerEntries(entries);
      setLedgerSummary(
        data.summary || {
          totalMilk: 0,
          totalAmount: 0,
          totalUnpaid: 0,
        },
      );
    } catch (loadError) {
      setLedgerError(loadError instanceof Error ? loadError.message : "Unable to load ledger");
    } finally {
      setIsLoadingLedger(false);
    }
  }

  async function openLedger(vendor: VendorRecord) {
    setLedgerVendorCode(vendor.code);
    setLedgerFilters({ dateFrom: "", dateTo: "" });
    await loadLedger(vendor.code);
  }

  const areaOptions = [
    { code: "ALL", name: "All areas" },
    ...areas.map(a => ({
      code: a.code,
      name: typeof a.name === 'string' ? a.name : (a.name[locale as keyof typeof a.name] || a.name.en)
    })),
  ];

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Vendor notebook</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Fast daily milk entry, live rate tracking, and simple supplier ledger follow-up.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto_auto]">
            <AdminSelect
              value={filterAreaCode}
              onChange={(event) => setFilterAreaCode(event.target.value)}
            >
              {areaOptions.map((area) => (
                <option key={area.code} value={area.code}>
                  {area.name}
                </option>
              ))}
            </AdminSelect>
            <label className="admin-panel-muted flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm font-medium text-[var(--admin-text)]">
              <input
                type="checkbox"
                checked={groupByArea}
                onChange={(event) => setGroupByArea(event.target.checked)}
                className="h-4 w-4 accent-[var(--admin-primary-strong)]"
              />
              Group by area
            </label>
            <AdminButton onClick={openNewForm}>
              <Plus className="h-4 w-4" />
              New vendor
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      <div className="space-y-4">
        {groupedVendors.map((group) => (
          <section key={group.label || "all"} className="space-y-3">
            {groupByArea ? (
              <div className="px-1">
                <h3 className="text-sm font-semibold uppercase text-[var(--admin-muted)]">
                  {group.label}
                </h3>
              </div>
            ) : null}

            {group.vendors.map((vendor) => {
              const phoneNumber = normalizePhone(vendor.phone);
              const rateToShow = vendor.defaultRate || vendor.lastRate || 0;
              const quantityToShow = vendor.lastQuantity || vendor.averageSupply || 0;

              return (
                <article key={vendor.code} className="admin-panel rounded-[24px] p-4 sm:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-[var(--admin-text)]">
                              {vendor.name}
                            </h3>
                            <AdminBadge tone={vendor.unpaidAmount ? "danger" : "success"}>
                              {vendor.unpaidAmount ? "Unpaid" : "Clear"}
                            </AdminBadge>
                          </div>
                          <p className="mt-1 text-sm text-[var(--admin-muted)]">
                            {vendor.areaName || vendor.areaCode || "No area"}
                          </p>
                          <p className="mt-1 text-sm font-medium text-[var(--admin-text)]">
                            {quantityToShow.toFixed(1)} L @ ₹{rateToShow.toFixed(0)}/L
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {phoneNumber ? (
                          <>
                            <a
                              href={`tel:${phoneNumber}`}
                              className="admin-outline-button h-10 w-10 justify-center p-0"
                              aria-label={`Call ${vendor.name}`}
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={`https://wa.me/${phoneNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-outline-button h-10 w-10 justify-center p-0"
                              aria-label={`WhatsApp ${vendor.name}`}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEditForm(vendor)}
                          className="admin-outline-button h-10 w-10 justify-center p-0"
                          aria-label={`Edit ${vendor.name}`}
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-[18px] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                          Total milk
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                          {(vendor.totalMilkInward ?? 0).toFixed(1)} L
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                          Total paid
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                          {formatCurrencyINR(vendor.totalPaid ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                          Unpaid
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#d14646]">
                          {formatCurrencyINR(vendor.unpaidAmount ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                          Avg supply
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--admin-text)]">
                          {(vendor.averageSupply ?? 0).toFixed(1)} L
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap gap-2 text-sm text-[var(--admin-muted)]">
                        <span className="admin-panel-muted rounded-full px-3 py-1.5">
                          Default rate ₹{(vendor.defaultRate ?? 0).toFixed(0)}
                        </span>
                        <span className="admin-panel-muted rounded-full px-3 py-1.5">
                          Last entry {vendor.lastPurchaseDate || "No entries"}
                        </span>
                        <span className="admin-panel-muted rounded-full px-3 py-1.5">
                          {vendor.purchaseCount ?? 0} entries
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <AdminButton
                          className="justify-center"
                          onClick={() => openEntryFlow(vendor)}
                        >
                          <Plus className="h-4 w-4" />
                          Add today milk
                        </AdminButton>
                        <AdminButton
                          variant="secondary"
                          className="justify-center"
                          onClick={() => void openLedger(vendor)}
                        >
                          View ledger
                        </AdminButton>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        {filteredVendors.length === 0 ? (
          <AdminCard className="text-center text-sm text-[var(--admin-muted)]">
            No vendors match this area filter yet.
          </AdminCard>
        ) : null}
      </div>

      {formVisible ? (
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {selectedVendor ? "Edit vendor" : "New vendor"}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Keep phone, area, and default rate ready so daily entry stays quick.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="admin-outline-button h-10 w-10 justify-center p-0"
              aria-label="Close vendor form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Vendor code">
                <AdminInput
                  value={vendorForm.code}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, code: event.target.value }))
                  }
                  disabled={!!selectedVendor}
                />
              </AdminField>
              <AdminField label="Name">
                <AdminInput
                  value={vendorForm.name}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </AdminField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <AdminField label="Phone">
                <AdminInput
                  value={vendorForm.phone}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Default rate (₹/L)">
                <AdminInput
                  value={vendorForm.defaultRate}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, defaultRate: event.target.value }))
                  }
                  inputMode="decimal"
                />
              </AdminField>
              <AdminField label="Area">
                <AdminSelect
                  value={vendorForm.areaCode}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, areaCode: event.target.value }))
                  }
                >
                  {areas.map((area) => (
                    <option key={area.code} value={area.code}>
                      {area.code} • {typeof area.name === 'string' ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            </div>

            <AdminField label="Note">
              <AdminInput
                value={vendorForm.notes}
                onChange={(event) =>
                  setVendorForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </AdminField>

            <AdminField label="Status">
              <AdminSelect
                value={vendorForm.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(event) =>
                  setVendorForm((current) => ({
                    ...current,
                    isActive: event.target.value === "ACTIVE",
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </AdminSelect>
            </AdminField>

            {error ? (
              <div className="rounded-[18px] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm font-medium text-[#d14646]">
                {error}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-4">
              <AdminButton className="justify-center" onClick={saveVendor} disabled={isSavingVendor}>
                Save
              </AdminButton>
              <AdminButton
                variant="secondary"
                className="justify-center"
                onClick={() => setVendorForm(getStartingVendorForm(areas, selectedVendor))}
              >
                Reset
              </AdminButton>
              <AdminButton
                variant="outline"
                className="justify-center"
                onClick={deleteVendor}
                disabled={!selectedVendor}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </AdminButton>
              <AdminButton
                variant="outline"
                className="justify-center"
                onClick={() => setFormVisible(false)}
              >
                Cancel
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {activeEntryVendor ? (
        <div className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.35)] px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-xl items-end sm:items-center">
            <div className="admin-panel max-h-full w-full overflow-y-auto rounded-[28px] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--admin-text)]">
                    + Add today milk
                  </h2>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {activeEntryVendor.name} • {activeEntryVendor.areaName || activeEntryVendor.areaCode || "No area"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEntryFlow}
                  className="admin-outline-button h-10 w-10 justify-center p-0"
                  aria-label="Close milk entry"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Date">
                    <AdminInput
                      type="date"
                      value={entryForm.date}
                      onChange={(event) =>
                        setEntryForm((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </AdminField>
                  <AdminField label="Status">
                    <AdminSelect
                      value={entryForm.status}
                      onChange={(event) =>
                        setEntryForm((current) => ({
                          ...current,
                          status: event.target.value as "PAID" | "UNPAID",
                        }))
                      }
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PAID">Paid</option>
                    </AdminSelect>
                  </AdminField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Quantity (litres)">
                    <AdminInput
                      ref={entryQuantityRef}
                      value={entryForm.quantity}
                      onChange={(event) =>
                        setEntryForm((current) => ({ ...current, quantity: event.target.value }))
                      }
                      inputMode="decimal"
                    />
                  </AdminField>
                  <AdminField label="Rate (₹/L)">
                    <AdminInput
                      value={entryForm.rate}
                      onChange={(event) =>
                        setEntryForm((current) => ({ ...current, rate: event.target.value }))
                      }
                      inputMode="decimal"
                    />
                  </AdminField>
                </div>

                <div className="rounded-[22px] bg-[var(--admin-primary-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--admin-text)]">
                    {formatCurrencyINR(entryTotal)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--admin-muted)]">
                    Auto-filled from vendor defaults and latest supply where available.
                  </p>
                </div>

                {entryError ? (
                  <div className="rounded-[18px] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm font-medium text-[#d14646]">
                    {entryError}
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <AdminButton
                    className="justify-center"
                    onClick={() => void saveMilkEntry("stay")}
                    disabled={isSavingEntry}
                  >
                    Save entry
                  </AdminButton>
                  <AdminButton
                    variant="secondary"
                    className="justify-center"
                    onClick={() => void saveMilkEntry("next")}
                    disabled={isSavingEntry}
                  >
                    Save & next vendor
                  </AdminButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {ledgerVendor ? (
        <div className="fixed inset-0 z-30 bg-[rgba(15,23,42,0.28)] backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-2xl">
            <div className="admin-panel h-full w-full overflow-y-auto rounded-none p-5 sm:rounded-l-[28px] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--admin-text)]">
                    {ledgerVendor.name} ledger
                  </h2>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    Date-wise milk notebook with paid and unpaid follow-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLedgerVendorCode(null)}
                  className="admin-outline-button h-10 w-10 justify-center p-0"
                  aria-label="Close ledger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <AdminField label="Date from">
                  <AdminInput
                    type="date"
                    value={ledgerFilters.dateFrom}
                    onChange={(event) =>
                      setLedgerFilters((current) => ({ ...current, dateFrom: event.target.value }))
                    }
                  />
                </AdminField>
                <AdminField label="Date to">
                  <AdminInput
                    type="date"
                    value={ledgerFilters.dateTo}
                    onChange={(event) =>
                      setLedgerFilters((current) => ({ ...current, dateTo: event.target.value }))
                    }
                  />
                </AdminField>
              </div>

              <div className="mt-4 flex gap-2">
                <AdminButton
                  className="justify-center"
                  onClick={() =>
                    void loadLedger(ledgerVendor.code, ledgerFilters.dateFrom, ledgerFilters.dateTo)
                  }
                >
                  Apply filter
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  className="justify-center"
                  onClick={() => {
                    const nextFilters = { dateFrom: "", dateTo: "" };
                    setLedgerFilters(nextFilters);
                    void loadLedger(ledgerVendor.code);
                  }}
                >
                  Reset
                </AdminButton>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                    Total milk
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                    {ledgerSummary.totalMilk.toFixed(1)} L
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                    Total amount
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                    {formatCurrencyINR(ledgerSummary.totalAmount)}
                  </p>
                </div>
                <div className="rounded-[18px] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase text-[var(--admin-muted)]">
                    Total unpaid
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#d14646]">
                    {formatCurrencyINR(ledgerSummary.totalUnpaid)}
                  </p>
                </div>
              </div>

              {ledgerError ? (
                <div className="mt-4 rounded-[18px] bg-[var(--admin-danger-soft)] px-4 py-3 text-sm font-medium text-[#d14646]">
                  {ledgerError}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {isLoadingLedger ? (
                  <div className="rounded-[18px] bg-white px-4 py-6 text-sm text-[var(--admin-muted)]">
                    Loading ledger...
                  </div>
                ) : null}

                {!isLoadingLedger && ledgerEntries.length === 0 ? (
                  <div className="rounded-[18px] bg-white px-4 py-6 text-sm text-[var(--admin-muted)]">
                    No milk entries found for this filter.
                  </div>
                ) : null}

                {!isLoadingLedger
                  ? ledgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-[18px] bg-white px-4 py-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.9fr_1fr_auto] sm:items-center">
                          <div>
                            <p className="font-semibold text-[var(--admin-text)]">
                              {entry.dateLabel}
                            </p>
                            <p className="mt-1 text-sm text-[var(--admin-muted)]">
                              {entry.quantity.toFixed(1)} L
                            </p>
                          </div>
                          <div className="text-sm font-medium text-[var(--admin-text)]">
                            ₹{entry.rate.toFixed(0)}/L
                          </div>
                          <div className="text-sm font-semibold text-[var(--admin-text)]">
                            {formatCurrencyINR(entry.total)}
                          </div>
                          <div>
                            <AdminBadge tone={entry.status === "PAID" ? "success" : "danger"}>
                              {entry.status}
                            </AdminBadge>
                          </div>
                          <div className="text-xs uppercase text-[var(--admin-muted)]">
                            {entry.vendorCode}
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
