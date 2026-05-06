"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard, AdminStatCard } from "@/components/layout/admin-ui";
import { BillingManagement } from "@/components/billing/billing-management";
import { RecentEntries } from "@/components/billing/recent-entries";
import { formatCurrencyINR } from "@/lib/utils";
import { BadgeIndianRupee, CircleDollarSign, WalletCards } from "lucide-react";

type BillingDashboardProps = {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    accountsTitle: string;
    accountsSubtitle: string;
    recentEntriesTitle: string;
    recentEntriesSubtitle: string;
    viewAllPayments: string;
    monthEndSummary: string;
    stats: {
      billed: string;
      billedHint: string;
      received: string;
      receivedHint: string;
      due: string;
      dueHint: string;
    };
  };
  data: {
    summary: {
      billedAmount: number;
      paidAmount: number;
      dueAmount: number;
    };
    customers: any[];
    recentPayments: any[];
  };
};

export function BillingDashboard({ locale, translations, data }: BillingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = data.customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.customerCode.toLowerCase().includes(query)
    );
  });

  const searchBar = (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-4 w-4 text-[var(--admin-muted)]" />
      </div>
      <input
        type="text"
        placeholder="Search customer..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-[20px] border border-[var(--admin-border)] bg-white py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-[var(--admin-primary)] focus:ring-4 focus:ring-[rgba(59,130,246,0.08)]"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <AdminShell 
      locale={locale} 
      title={translations.title} 
      subtitle={translations.subtitle}
    >
      {/* Search bar */}
      <div className="mb-4">{searchBar}</div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <AdminStatCard
          label={translations.stats.billed}
          value={formatCurrencyINR(data.summary.billedAmount)}
          hint={translations.stats.billedHint}
          icon={BadgeIndianRupee}
        />
        <AdminStatCard
          label={translations.stats.received}
          value={formatCurrencyINR(data.summary.paidAmount)}
          hint={translations.stats.receivedHint}
          icon={WalletCards}
          tone="success"
        />
        <AdminStatCard
          label={translations.stats.due}
          value={formatCurrencyINR(data.summary.dueAmount)}
          hint={translations.stats.dueHint}
          icon={CircleDollarSign}
          tone="warning"
          className="col-span-2 md:col-span-1"
        />
      </div>

      <div className="mt-4 grid gap-4">
        <AdminCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--admin-text)]">
                {translations.accountsTitle}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{translations.accountsSubtitle}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <BillingManagement customers={filteredCustomers} />
          </div>
        </AdminCard>

        {data.recentPayments.length > 0 && !searchQuery && (
          <AdminCard className="mt-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--admin-text)]">
                {translations.recentEntriesTitle}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {translations.recentEntriesSubtitle}
              </p>
            </div>
            <RecentEntries 
              payments={data.recentPayments} 
              viewAllLabel={translations.viewAllPayments} 
            />
          </AdminCard>
        )}
      </div>
    </AdminShell>
  );
}
