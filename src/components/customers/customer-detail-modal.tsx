"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  CalendarDays, 
  CircleCheck, 
  CirclePause, 
  CirclePlay,
  CircleX, 
  CreditCard, 
  MapPin, 
  Phone, 
  WalletCards 
} from "lucide-react";
import { AdminBadge, AdminDivider } from "@/components/layout/admin-ui";
import { AdminModal } from "@/components/layout/admin-modal";
import { cn, formatCurrencyINR } from "@/lib/utils";
import { CustomerForm } from "./customer-form";

type DeliveryLog = {
  dateLabel: string;
  status: "DELIVERED" | "SKIPPED" | "PAUSED";
  finalQuantity: number;
  extraQuantity: number;
  date?: string; // Original date string if available
};

type CustomerDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    customerCode: string;
    name: string;
    phone: string;
    address: string;
    areaName: string;
    areaCode: string;
    quantityLabel: string;
    quantity: number;
    rate: number;
    due: number;
    notes?: string;
    deliveryInstruction?: string;
  } | null;
  areas?: any[];
  locale: string;
  mode?: "view" | "details" | "edit" | "schedule";
};

export function CustomerDetailModal({ 
  isOpen, 
  onClose, 
  customer, 
  areas = [],
  locale,
  mode = "details"
}: CustomerDetailModalProps) {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullData, setFullData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && customer) {
      setIsLoading(true);
      fetch(`/api/customers/${customer.customerCode}`)
        .then((res) => res.json())
        .then((data) => {
          setFullData(data.customer);
          if (data.customer?.recentDeliveries) {
            setLogs(data.customer.recentDeliveries);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, customer]);

  if (!customer) return null;

  // Helper to get color for a specific day from logs
  const getDayStatus = (dayNum: number) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    // Check logs for this date (simple check, ideally logs should have date field)
    const log = logs.find(l => {
        // If log has date property use it, else try parsing dateLabel
        if (l.date) return l.date.includes(dateStr);
        // DateLabel is often "29 Apr", "30 Apr"
        return l.dateLabel.startsWith(String(dayNum).padStart(2, '0'));
    });

    if (!log) return "pending";
    return log.status.toLowerCase();
  };

  return (
    <AdminModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        mode === "edit" ? "Edit Customer" : 
        mode === "schedule" ? "Delivery Schedule" : 
        mode === "view" ? "Customer Preview" : "Customer Profile"
      }
    >
      {mode === "edit" ? (
        <div className="px-1 py-2">
          <CustomerForm
            locale={locale}
            mode="edit"
            customerCode={customer.customerCode}
            areas={areas} 
            onSuccess={() => {
              onClose();
            }}
            initialValues={{
              name: customer.name,
              phone: customer.phone,
              preferredLanguage: "en",
              addressLine1: customer.address,
              addressLine2: "",
              areaCode: customer.areaCode,
              landmark: "",
              deliveryInstruction: customer.deliveryInstruction || "",
              internalNote: customer.notes || "",
              quantityLiters: customer.quantity || 0,
              pricePerLiter: customer.rate || 0,
              unitLabel: "L",
              status: "ACTIVE",
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Info - Only if NOT in schedule mode to keep it light as per request */}
          {mode !== "schedule" && (
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="text-xl font-black text-[var(--admin-text)] tracking-tight">{customer.name}</h2>
              <p className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest">{customer.customerCode}</p>
            </div>
          )}

          {mode === "schedule" ? (
            <div className="space-y-6">
              {/* Header for schedule */}
              <div className="flex flex-col gap-1 mb-2">
                <h2 className="text-lg font-black text-[var(--admin-text)] tracking-tight">{customer.name}</h2>
                <p className="text-[10px] font-bold text-[var(--admin-muted)] uppercase tracking-widest">Customer Schedule & History</p>
              </div>

              {/* Month View Calendar */}
              <div className="admin-panel-muted rounded-[28px] p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--admin-text)]">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Del</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Skp</span></div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Pse</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                        const status = getDayStatus(day);
                        return (
                            <div 
                                key={day} 
                                className={cn(
                                    "aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all border",
                                    status === "delivered" ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" :
                                    status === "skipped" ? "bg-rose-500 text-white border-rose-600 shadow-sm" :
                                    status === "paused" ? "bg-amber-500 text-white border-amber-600 shadow-sm" :
                                    "bg-white text-gray-400 border-gray-100"
                                )}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
              </div>

              {/* Pause/Resume Info */}
              <div className="grid gap-3">
                 <div className="rounded-[24px] bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Plan Details</span>
                    </div>
                    <p className="text-sm font-bold text-blue-900">
                        {customer.quantityLabel} delivery daily to <span className="underline">{customer.areaName}</span>
                    </p>
                 </div>

                 {fullData?.exceptions?.length > 0 ? (
                    <div className="rounded-[24px] bg-amber-50 border border-amber-100 p-4">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <CirclePause className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Pauses</span>
                        </div>
                        <div className="space-y-2">
                            {fullData.exceptions.map((ex: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-bold text-amber-900">
                                    <span>{new Date(ex.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                    <AdminBadge tone="warning" className="text-[9px]">{ex.type}</AdminBadge>
                                </div>
                            ))}
                        </div>
                    </div>
                 ) : (
                    <div className="rounded-[24px] bg-emerald-50 border border-emerald-100 p-4">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <CirclePlay className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Upcoming</span>
                        </div>
                        <p className="text-sm font-bold text-emerald-900">No upcoming pauses. Delivery active.</p>
                    </div>
                 )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="admin-panel-muted rounded-[24px] p-4">
                  <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Contact</span>
                  </div>
                  <p className="mt-2 text-base font-bold text-[var(--admin-text)]">{customer.phone}</p>
                </div>
                
                {mode === "details" && (
                  <div className="admin-panel-muted rounded-[24px] p-4">
                    <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                      <Building2 className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Area</span>
                    </div>
                    <p className="mt-2 text-base font-bold text-[var(--admin-text)]">
                      {customer.areaName} ({customer.areaCode})
                    </p>
                  </div>
                )}
              </div>

              {mode === "details" && (
                <div className="admin-panel-muted rounded-[24px] p-4">
                  <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Address</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--admin-text)]">{customer.address}</p>
                </div>
              )}

              {customer.deliveryInstruction && (
                <div className="rounded-[24px] bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Delivery Instruction</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-blue-900 leading-relaxed">
                    "{customer.deliveryInstruction}"
                  </p>
                </div>
              )}

              <AdminDivider className="my-2" />

              {/* Financials & Plan */}
              <div className={cn("grid gap-4", mode === "view" ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
                <div className="rounded-[24px] bg-[var(--admin-primary-soft)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">Milk Plan</p>
                  <p className="mt-1 text-xl font-bold text-[var(--admin-text)]">{customer.quantityLabel}</p>
                </div>
                {mode === "details" && (
                  <div className="rounded-[24px] bg-white border border-[var(--admin-border)] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">Rate</p>
                    <p className="mt-1 text-xl font-bold text-[var(--admin-text)]">{formatCurrencyINR(customer.rate)}</p>
                  </div>
                )}
                <div className="rounded-[24px] bg-white border border-[var(--admin-border)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">Due Amount</p>
                  <p className="mt-1 text-xl font-bold text-[#d14646]">{formatCurrencyINR(customer.due)}</p>
                </div>
              </div>

              {mode === "details" && customer.notes && (
                <div className="admin-panel-muted rounded-[24px] p-4">
                  <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                    <WalletCards className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Notes</span>
                  </div>
                  <p className="mt-2 text-sm italic text-[var(--admin-text)]">{customer.notes}</p>
                </div>
              )}

              {mode === "details" && (
                <>
                  <AdminDivider className="my-2" />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 text-base font-bold text-[var(--admin-text)]">
                        <CalendarDays className="h-4 w-4 text-[var(--admin-primary)]" />
                        Recent Delivery Logs
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="py-8 text-center text-sm text-[var(--admin-muted)] animate-pulse">
                          Loading history...
                        </div>
                      ) : Array.isArray(logs) && logs.length > 0 ? (
                        logs.map((log, index) => (
                          <div key={index} className="flex items-center justify-between rounded-[20px] bg-white border border-[var(--admin-border)] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full",
                                log.status === "DELIVERED" ? "bg-emerald-50 text-emerald-600" :
                                log.status === "PAUSED" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                              )}>
                                {log.status === "DELIVERED" ? <CircleCheck className="h-5 w-5" /> :
                                 log.status === "PAUSED" ? <CirclePause className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[var(--admin-text)]">{log.dateLabel}</p>
                                <p className="text-xs text-[var(--admin-muted)]">
                                  {log.status === "DELIVERED" ? `${log.finalQuantity} L delivered` : log.status}
                                </p>
                              </div>
                            </div>
                            <AdminBadge tone={
                              log.status === "DELIVERED" ? "success" : 
                              log.status === "PAUSED" ? "warning" : "danger"
                            } className="text-[10px] uppercase">
                              {log.status}
                            </AdminBadge>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-sm text-[var(--admin-muted)] border-2 border-dashed border-[var(--admin-border)] rounded-[24px]">
                          No recent activity found.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </AdminModal>
  );
}
