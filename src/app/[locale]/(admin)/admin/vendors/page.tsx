import { getTranslations, setRequestLocale } from "next-intl/server";
import { VendorManagementPanel } from "@/components/vendors/vendor-management-panel";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminCard } from "@/components/layout/admin-ui";
import { getAreasData, getVendorsData } from "@/lib/data-service";

type AdminVendorsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminVendorsPage({ params }: AdminVendorsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.vendors" });
  const [vendors, areas] = await Promise.all([getVendorsData(), getAreasData()]);

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <AdminCard>
        <p className="text-sm text-[var(--admin-muted)]">{t("note")}</p>
      </AdminCard>
      <VendorManagementPanel
        initialVendors={vendors}
        areas={areas}
        locale={locale}
      />
    </AdminShell>
  );
}
