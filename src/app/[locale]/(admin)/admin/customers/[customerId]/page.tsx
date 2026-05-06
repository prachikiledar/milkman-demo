import Link from "next/link";
import {
  ChevronLeft,
  FilePenLine,
  MapPin,
  Phone,
  WalletCards,
  Droplets,
  History,
  ShieldCheck
} from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { getCustomerDetailData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ locale: string; customerId: string }> }) {
  const { locale, customerId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const tStatus = await getTranslations({ locale, namespace: "status" });
  const customer = await getCustomerDetailData(customerId);

  if (!customer) notFound();

  return (
    <AdminShell locale={locale} title={customer.name} subtitle={t("detailSubtitle")} hideHero={true}>

      {/* 1. FLOATING BRANDED HEADER */}
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}/admin/customers`} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#064e3b] hover:text-white transition-all">
            <ChevronLeft size={24} />
          </Link>
          {/* Circular Branded Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-green-900/20 border-4 border-white">
            {customer.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">{customer.name}</h2>
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                <ShieldCheck size={12} /> {customer.status}
              </div>
            </div>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">
              ID: {customer.customerCode} <span className="mx-2 text-gray-200">|</span> {customer.areaCode}
            </p>
          </div>
        </div>
        <Link href={`/${locale}/admin/customers/${customer.id}/edit`} className="bg-[#064e3b] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg">
          <FilePenLine size={18} />
          {t("editCustomer")}
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[420px_1fr]">

        {/* 2. CONTACT SIDEBAR (LEFT) */}
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-10 relative overflow-hidden">
          <h3 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] border-b pb-4">{t("contact")}</h3>

          <div className="flex items-center gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center text-[#064e3b] shrink-0 border border-green-100 transition-transform group-hover:scale-105">
              <Phone size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile</p>
              <p className="text-lg font-bold text-gray-900 tracking-tight">{customer.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center text-[#064e3b] shrink-0 border border-green-100 transition-transform group-hover:scale-105">
              <MapPin size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("address")}</p>
              <p className="text-base font-bold text-gray-800 leading-snug">{customer.address}</p>
              <p className="text-[10px] font-black text-green-600 mt-3 bg-green-50 px-2 py-1 rounded inline-block uppercase">{customer.areaName}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
              <WalletCards size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-sm font-medium text-gray-500 italic leading-relaxed">
                {customer.notes || t("noInternalNote")}
              </p>
            </div>
          </div>
        </div>

        {/* 3. PERFORMANCE STATS (RIGHT) */}
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Milk Plan - Solid Brand Color */}
            <div className="bg-[#064e3b] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-green-900/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-4">{t("milkPlan")}</p>
              <p className="text-5xl font-black tracking-tighter leading-none">{customer.quantityLabel}</p>
              <Droplets className="absolute -right-8 -bottom-8 text-white/5" size={160} />
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{t("rate")}</p>
              <p className="text-4xl font-black tracking-tighter text-gray-900 leading-none">{formatCurrencyINR(customer.rate)}</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border-2 border-red-50 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-red-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-6">{t("due")}</p>
              <p className="text-4xl font-black tracking-tighter text-red-600 leading-none">{formatCurrencyINR(customer.due)}</p>
            </div>
          </div>

          {/* ACTIVITY LOG */}
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-8 bg-[#064e3b] rounded-full" />
                {t("recentDeliveryLog")}
              </h3>
              <Link href={`/${locale}/admin/billing`} className="px-6 py-3 bg-[#f0fdf4] text-[#064e3b] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#064e3b] hover:text-white transition-all shadow-sm">
                {t("recordPayment")}
              </Link>
            </div>

            <div className="space-y-3">
              {customer.recentDeliveries.map((entry) => (
                <div key={entry.dateLabel} className="flex items-center justify-between p-6 rounded-[28px] bg-gray-50 border border-gray-100 hover:border-green-300 hover:bg-white transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-[#064e3b] font-black text-xs">
                      {entry.dateLabel.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 tracking-tight">{entry.dateLabel}</p>
                      <p className="text-xs font-bold text-gray-400">
                        Total: <span className="text-[#064e3b] font-black">{entry.finalQuantity} Liters</span>
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest border",
                    entry.status === "DELIVERED" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}