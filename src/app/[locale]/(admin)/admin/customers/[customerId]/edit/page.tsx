import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CustomerForm } from "@/components/customers/customer-form";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard } from "@/components/layout/admin-ui";
import { getAreasData, getCustomerDetailData } from "@/lib/data-service";

type EditCustomerPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { locale, customerId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const [customer, areas] = await Promise.all([
    getCustomerDetailData(customerId),
    getAreasData(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <AdminShell locale={locale} title={t("editTitle")} subtitle={t("editSubtitle")} hideHero={true}>
      <AdminCard>
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/customers/${customer.id}`}
            className="admin-icon-button h-11 w-11"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">{customer.name}</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{t("editReviewNote")}</p>
          </div>
        </div>
      </AdminCard>

      <CustomerForm
        locale={locale}
        mode="edit"
        customerCode={customer.customerCode}
        areas={areas.map((area) => ({ code: area.code, name: area.name }))}
        initialValues={{
          name: customer.name,
          phone: customer.phone,
          preferredLanguage: (customer.preferredLanguage as "en" | "hi") || "en",
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2,
          areaCode: customer.areaCode,
          landmark: customer.landmark,
          deliveryInstruction: customer.deliveryInstruction || "",
          internalNote: customer.notes,
          quantityLiters: customer.quantity,
          pricePerLiter: customer.rate,
          unitLabel: "L",
          status: customer.status as "ACTIVE" | "PAUSED" | "INACTIVE",
        }}
      />
    </AdminShell>
  );
}
