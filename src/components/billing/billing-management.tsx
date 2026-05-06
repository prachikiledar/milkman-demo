"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BadgeIndianRupee, 
  ChevronRight, 
  CircleDollarSign, 
  Clock, 
  History, 
  Plus, 
  WalletCards,
  CheckCircle2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { 
  AdminBadge, 
  AdminButton, 
  AdminCard, 
  AdminField, 
  AdminInput, 
  AdminSelect 
} from "@/components/layout/admin-ui";
import { AdminModal } from "@/components/layout/admin-modal";
import { formatCurrencyINR, cn } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  date: string | Date;
  dateLabel: string;
  mode: string;
  note: string;
};

type CustomerAccount = {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  areaCode: string;
  areaName: string;
  billed: number;
  paid: number;
  due: number;
  advance: number;
  lastPayment: {
    amount: number;
    date: string | Date;
    dateLabel: string;
    mode: string;
  } | null;
  paymentHistory: Payment[];
};

type BillingManagementProps = {
  customers: CustomerAccount[];
};

export function BillingManagement({ customers }: BillingManagementProps) {
  const router = useRouter();
  const t = useTranslations("admin.billing");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("UPI");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const openPaymentModal = (customer: CustomerAccount) => {
    setSelectedCustomer(customer);
    setAmount("");
    setMode("UPI");
    setNote("");
    setFeedback(null);
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = (customer: CustomerAccount) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedCustomer || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCode: selectedCustomer.customerCode,
          amount: Number(amount),
          mode,
          note,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save payment");
      }

      setFeedback({
        message: `₹${amount} received from ${selectedCustomer.name}`,
        type: "success",
      });

      // Clear form after a short delay and close modal
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        router.refresh();
      }, 1500);

    } catch (error) {
      setFeedback({
        message: "Unable to save payment. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mt-6 grid gap-4">
        {customers.length > 0 ? customers.map((account) => (
          <article 
            key={account.customerCode} 
            className="admin-panel-muted group relative rounded-[28px] p-4 sm:p-5 transition-all hover:bg-[var(--admin-primary-soft)]/40 hover:shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:gap-6">
              {/* Row 1: Name + Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate text-base font-bold text-[var(--admin-text)] sm:text-xl">
                    {account.name && !account.name.startsWith("CUST-") ? account.name : (account.phone || account.customerCode)}
                  </h3>
                  <AdminBadge 
                    tone={account.advance > 0 ? "success" : account.due > 0 ? "warning" : "success"} 
                    className="flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight sm:px-3 sm:py-1 sm:text-[11px]"
                  >
                    {account.advance > 0 ? `Advance ₹${account.advance}` : account.due > 0 ? `Due ₹${account.due}` : "Paid"}
                  </AdminBadge>
                </div>

                <AdminButton 
                  onClick={() => openPaymentModal(account)}
                  className="h-9 flex-shrink-0 flex items-center justify-center gap-1 rounded-xl px-3 py-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all sm:h-12 sm:gap-2 sm:px-6 sm:py-3"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[13px] font-bold sm:text-base">Pay</span>
                </AdminButton>
              </div>

              {/* Row 2: Last Payment */}
              <div className="flex items-center justify-between">
                {account.lastPayment ? (
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--admin-muted)] sm:text-sm">
                    <Clock className="h-3.5 w-3.5 text-[var(--admin-primary)] sm:h-4 sm:w-4" />
                    Last: <span className="text-[var(--admin-text)]">{formatCurrencyINR(account.lastPayment.amount)}</span>
                    <span className="hidden sm:inline"> ({account.lastPayment.dateLabel}, {account.lastPayment.mode})</span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-[11px] text-[var(--admin-muted)] italic sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    No payments yet
                  </p>
                )}

                <button 
                  onClick={() => openHistoryModal(account)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[var(--admin-primary)] hover:underline sm:hidden"
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </button>
              </div>

              {/* Row 3: 3-Column Grid */}
              <div className="grid grid-cols-3 gap-2 border-t border-[var(--admin-border)]/30 pt-3 sm:flex sm:flex-wrap sm:gap-x-8 sm:border-0 sm:pt-1">
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--admin-muted)] sm:tracking-widest">Billed</p>
                  <p className="text-sm font-bold text-[var(--admin-text)] sm:text-lg">{formatCurrencyINR(account.billed)}</p>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--admin-muted)] sm:tracking-widest">Paid</p>
                  <p className="text-sm font-bold text-emerald-600 sm:text-lg">{formatCurrencyINR(account.paid)}</p>
                </div>
                <div className={cn(
                  "flex flex-col items-center sm:items-start rounded-xl sm:px-4 sm:py-1 sm:-ml-4",
                  account.advance > 0 ? "bg-emerald-50/50 sm:bg-emerald-50/50" : "bg-amber-50/50 sm:bg-white/50"
                )}>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[var(--admin-muted)] sm:tracking-widest">
                    {account.advance > 0 ? "Advance" : "Balance Due"}
                  </p>
                  <p className={cn(
                    "text-sm font-black sm:text-lg",
                    account.advance > 0 ? "text-emerald-700" : "text-amber-600"
                  )}>
                    {formatCurrencyINR(account.advance > 0 ? account.advance : account.due)}
                  </p>
                </div>
              </div>
              
              {/* Desktop History Button */}
              <div className="hidden sm:block">
                <AdminButton 
                  variant="outline"
                  onClick={() => openHistoryModal(account)}
                  className="h-10 w-full rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </AdminButton>
              </div>
            </div>
          </article>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-bold text-[var(--admin-muted)]">No customers found</p>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <AdminModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Add Payment: ${selectedCustomer?.name}`}
      >
        <div className="space-y-6">
          {feedback ? (
            <div className={cn(
              "flex items-center gap-3 rounded-[24px] p-5 animate-in fade-in slide-in-from-top-4 duration-500",
              feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              {feedback.type === "success" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              <p className="text-base font-bold">{feedback.message}</p>
            </div>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <AdminField label="Amount to pay (₹)">
              <AdminInput 
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-bold py-4"
                autoFocus
              />
            </AdminField>
            
            <AdminField label="Payment Mode">
              <AdminSelect 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
                className="text-base font-semibold py-4"
              >
                <option value="UPI">UPI Payment</option>
                <option value="CASH">Cash Payment</option>
                <option value="BANK">Bank Transfer</option>
              </AdminSelect>
            </AdminField>
          </div>

          <AdminField label="Optional Note">
            <AdminInput 
              placeholder="e.g. Received at doorstep"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="py-4"
            />
          </AdminField>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            <AdminButton 
              variant="outline" 
              onClick={() => setIsPaymentModalOpen(false)}
              className="rounded-2xl px-8 py-4 font-bold sm:w-auto"
            >
              Cancel
            </AdminButton>
            <AdminButton 
              onClick={handleSavePayment} 
              disabled={isSubmitting || !amount}
              className="rounded-2xl px-10 py-4 font-bold shadow-xl shadow-blue-500/20 sm:w-auto"
            >
              {isSubmitting ? "Saving Entry..." : "Save Payment"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* History Modal */}
      <AdminModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Payment History: ${selectedCustomer?.name}`}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-[var(--admin-primary-soft)]/30 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)]">Monthly Billed</p>
              <p className="text-xl font-bold text-[var(--admin-text)]">{formatCurrencyINR(selectedCustomer?.billed || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)]">Advance Balance</p>
              <p className="text-xl font-black text-emerald-600">{formatCurrencyINR(selectedCustomer?.advance || 0)}</p>
            </div>
          </div>

          {selectedCustomer?.paymentHistory && selectedCustomer.paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {selectedCustomer.paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-2xl bg-[var(--admin-panel-muted)] p-4 border border-transparent hover:border-[var(--admin-border)] transition-all">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[var(--admin-text)]">
                      {payment.dateLabel}
                    </p>
                    <div className="flex items-center gap-2">
                      <AdminBadge tone="blue" className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase">{payment.mode}</AdminBadge>
                      {payment.note && (
                        <p className="text-xs font-medium text-[var(--admin-muted)] italic">
                          {payment.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-emerald-600">
                      {formatCurrencyINR(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--admin-panel-muted)] text-[var(--admin-muted)]">
                <History className="h-10 w-10 opacity-20" />
              </div>
              <p className="mt-6 text-lg font-bold text-[var(--admin-muted)]">No payments recorded yet</p>
              <p className="mt-2 text-sm text-[var(--admin-muted)] opacity-60">Add a payment to see it here.</p>
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <AdminButton 
              variant="outline" 
              onClick={() => setIsHistoryModalOpen(false)}
              className="rounded-2xl px-10 font-bold"
            >
              Close
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
