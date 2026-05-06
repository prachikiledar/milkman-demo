"use client";

import { useState } from "react";
import { Clock, Info, ChevronRight } from "lucide-react";
import { AdminBadge, AdminButton } from "@/components/layout/admin-ui";
import { AdminModal } from "@/components/layout/admin-modal";
import { formatCurrencyINR } from "@/lib/utils";
import { Link } from "@/i18n/routing";

type Transaction = {
  id: string;
  amount: number;
  mode: string;
  note: string;
};

type GroupedPayment = {
  customerId: string;
  customerCode: string;
  customerName: string;
  dateLabel: string;
  totalAmount: number;
  transactions: Transaction[];
};

type RecentEntriesProps = {
  payments: GroupedPayment[];
  viewAllLabel: string;
};

export function RecentEntries({ payments, viewAllLabel }: RecentEntriesProps) {
  const [selectedGroup, setSelectedGroup] = useState<GroupedPayment | null>(null);

  const visiblePayments = payments.slice(0, 5);
  const hasMore = payments.length > 5;
  const moreCount = payments.length - 5;

  return (
    <>
      <div className="mt-5 grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visiblePayments.map((group, index) => (
          <div
            key={`${group.customerId}-${group.dateLabel}-${index}`}
            className="admin-panel-muted flex flex-col gap-2 rounded-[24px] p-3 transition-all hover:bg-[var(--admin-primary-soft)]/40 sm:gap-3 sm:p-4"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="truncate text-[13px] font-bold text-[var(--admin-text)] sm:text-sm" title={group.customerName}>
                {group.customerName}
              </p>
              {group.transactions.length > 1 ? (
                <AdminBadge tone="blue" className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none sm:text-[9px]">
                  {group.transactions.length}
                </AdminBadge>
              ) : (
                <AdminBadge tone="success" className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none sm:text-[9px]">
                  {group.transactions[0]?.mode || "UPI"}
                </AdminBadge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--admin-muted)]">
              <Clock className="h-3 w-3" />
              {group.dateLabel}
            </div>

            <div className="mt-0.5 flex items-center justify-between">
              <p className="text-[15px] font-black text-emerald-600 sm:text-sm sm:font-extrabold">
                {formatCurrencyINR(group.totalAmount)}
              </p>
              
              {group.transactions.length > 1 ? (
                <button 
                  onClick={() => setSelectedGroup(group)}
                  className="flex items-center gap-1 text-[9px] font-bold text-[var(--admin-primary)] hover:underline"
                >
                  <Info className="h-3 w-3" />
                  Details
                </button>
              ) : group.transactions[0]?.note ? (
                <p className="text-[9px] text-[var(--admin-muted)] truncate max-w-[60px]" title={group.transactions[0].note}>
                  {group.transactions[0].note}
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="admin-panel-muted flex flex-col items-center justify-center gap-1 rounded-[24px] p-4 border border-dashed border-[var(--admin-border)] bg-[var(--admin-primary-soft)]/10">
            <p className="text-xl font-black text-[var(--admin-primary)]">+{moreCount}</p>
            <p className="text-[9px] font-bold text-[var(--admin-muted)] uppercase tracking-wider">More</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/admin/reports">
          <AdminButton 
            variant="outline" 
            className="rounded-[20px] px-8 py-2.5 font-bold flex items-center gap-2 group transition-all hover:bg-[var(--admin-primary)] hover:text-white"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </AdminButton>
        </Link>
      </div>

      <AdminModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={`Payment Details: ${selectedGroup?.customerName}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-[var(--admin-primary-soft)]/30 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)]">Total Received</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrencyINR(selectedGroup?.totalAmount || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--admin-muted)]">Date</p>
              <p className="text-base font-bold text-[var(--admin-text)]">{selectedGroup?.dateLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[var(--admin-text)] px-1">Individual Transactions</p>
            {selectedGroup?.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] p-3 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AdminBadge tone="blue" className="text-[9px] font-bold uppercase py-0.5">{tx.mode}</AdminBadge>
                    {tx.note && <span className="text-xs text-[var(--admin-muted)] italic">"{tx.note}"</span>}
                  </div>
                </div>
                <p className="text-base font-bold text-[var(--admin-text)]">{formatCurrencyINR(tx.amount)}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <AdminButton variant="outline" onClick={() => setSelectedGroup(null)} className="rounded-xl px-8 font-bold">
              Close
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
