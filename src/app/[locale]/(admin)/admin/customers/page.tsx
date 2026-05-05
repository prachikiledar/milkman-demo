import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { CustomerList } from "@/components/customers/customer-list";
import { getCustomerListData, getAreasData } from "@/lib/data-service";

type AdminCustomersPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCustomersPage({
  params,
}: AdminCustomersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const [customers, areas] = await Promise.all([
    getCustomerListData(),
    getAreasData()
  ]);

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")} hideHero={true}>
      <CustomerList customers={customers} areas={areas} locale={locale} />
    </AdminShell>
  );
}
