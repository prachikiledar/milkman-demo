"use client";

import { useState, useMemo } from "react";
import { Filter, Search, CirclePlus, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CustomerListItem } from "./customer-list-item";
import { CustomerDetailModal } from "./customer-detail-modal";

type CustomerListProps = {
  customers: any[];
  areas: any[];
  locale: string;
};

export function CustomerList({ customers, areas, locale }: CustomerListProps) {
  const t = useTranslations("admin.customers");
  const tCommon = useTranslations("common");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'details' | 'edit' | 'schedule'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // SEARCH & FILTER LOGIC[cite: 1]
  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm);

      const matchesFilter = activeFilter === "ALL" || c.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [customers, searchTerm, activeFilter]);

  const handleViewCustomer = (customer: any, mode: any = 'view') => {
    setSelectedCustomer(customer);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* SEARCH, FILTER & ADD BAR */}
      <div className="bg-white rounded-[20px] p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-none lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full bg-gray-50 border border-transparent focus:border-[#064e3b] focus:bg-white rounded-lg py-2 pl-10 pr-8 outline-none text-sm font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <select
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs font-black text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition-all"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>

          <Link
            href={`/${locale}/admin/customers/new`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#064e3b] !text-white rounded-lg text-xs font-black shadow-lg shadow-green-900/20 hover:bg-black transition-all"
          >
            <CirclePlus size={16} />
            {t("addCustomer")}
          </Link>
        </div>
      </div>

      {/* RENDER FILTERED LIST */}
      <section className="grid gap-1">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer: any) => (
            <CustomerListItem
              key={customer.id}
              customer={customer}
              locale={locale}
              onView={(mode: any) => handleViewCustomer(customer, mode)}
              isMenuOpen={openMenuId === customer.id}
              setMenuOpen={(isOpen: any) => setOpenMenuId(isOpen ? customer.id : null)}
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No customers found</p>
          </div>
        )}
      </section>

      <CustomerDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        areas={areas}
        locale={locale}
        mode={modalMode}
      />
    </div>
  );
}