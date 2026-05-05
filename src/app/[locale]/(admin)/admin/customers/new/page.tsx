import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CustomerForm } from "@/components/customers/customer-form";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard } from "@/components/layout/admin-ui";
import { getAreasData } from "@/lib/data-service";

type NewCustomerPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewCustomerPage({ params }: NewCustomerPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const areas = await getAreasData();

  const checklistKeys = ["capturePhone", "setRate", "mapArea", "addLandmark"] as const;

  return (
    <AdminShell locale={locale} title={t("newTitle")} subtitle={t("newSubtitle")} hideHero={true}>
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/admin/customers`} className="admin-icon-button h-11 w-11">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                {t("onboardingFormTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {t("onboardingFormSubtitle")}
              </p>
            </div>
          </div>
          <AdminBadge tone="blue">{t("liveCreateFlow")}</AdminBadge>
        </div>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <CustomerForm
          locale={locale}
          mode="create"
          areas={areas.map((area) => ({ 
            code: area.code, 
            name: typeof area.name === "string" ? area.name : (area.name[locale as keyof typeof area.name] || area.name.en) 
          }))}
        />

        <AdminCard>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">
            {t("checklistTitle")}
          </h2>
          <div className="mt-4 space-y-3">
            {checklistKeys.map((key) => (
              <div key={key} className="admin-panel-muted rounded-[22px] px-4 py-4">
                <p className="text-sm font-medium text-[var(--admin-text)]">
                  {t(`checklist.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
