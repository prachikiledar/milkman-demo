import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleDollarSign, ReceiptIndianRupee, Wallet } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import {
  getCustomerDetailData,
  getDefaultCustomerCode,
} from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";

type CustomerBillingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CustomerBillingPage({
  params,
}: CustomerBillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const customerCode = await getDefaultCustomerCode();
  const customer = customerCode ? await getCustomerDetailData(customerCode) : null;

  const rows = customer
    ? [
        {
          key: "monthlyBill" as const,
          label: t("billing.monthlyBill"),
          value: customer.billed,
          tone: "brand" as const,
          icon: ReceiptIndianRupee,
        },
        {
          key: "amountPaid" as const,
          label: t("billing.amountPaid"),
          value: customer.paid,
          tone: "mint" as const,
          icon: Wallet,
        },
        {
          key: "pendingDue" as const,
          label: t("billing.pendingDue"),
          value: customer.due,
          tone: "rose" as const,
          icon: CircleDollarSign,
        },
      ]
    : [];

  return (
    <CustomerShell locale={locale}>
      <div className="app-header">
        <div>
          <div className="title">{t("billing.title")}</div>
          <div className="subtitle">{t("billing.subtitle")}</div>
        </div>
      </div>

      <div className="split-3">
        {rows.map(({ key, label, value, tone, icon: Icon }) => (
          <article key={key} className="list-item">
            <div className={`thumb ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="meta">
              <strong>{label}</strong>
              <span>{formatCurrencyINR(value)}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="section-head">
        <h3>{t("billing.recentAddOns")}</h3>
      </div>
      <section className="card">
        {customer?.recentDeliveries.length ? (
          <p className="card-sub">
            {customer.recentDeliveries
              .flatMap((entry) => entry.addOnItems)
              .slice(0, 4)
              .map((item) => `${item.productName || item.productCode} × ${item.quantity || 0}`)
              .join(", ") || t("billing.noAddOns")}
          </p>
        ) : (
          <p className="card-sub">{t("billing.noAddOns")}</p>
        )}
      </section>
    </CustomerShell>
  );
}
