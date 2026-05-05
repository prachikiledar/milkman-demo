import { getTranslations, setRequestLocale } from "next-intl/server";
import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { getBillingData } from "@/lib/data-service";

type AdminBillingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminBillingPage({ params }: AdminBillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.billing" });
  const billing = await getBillingData();

  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    accountsTitle: t("accountsTitle"),
    accountsSubtitle: t("accountsSubtitle"),
    recentEntriesTitle: t("recentEntriesTitle"),
    recentEntriesSubtitle: t("recentEntriesSubtitle"),
    viewAllPayments: t("viewAllPayments"),
    monthEndSummary: t("monthEndSummary"),
    stats: {
      billed: t("stats.billed"),
      billedHint: t("stats.billedHint"),
      received: t("stats.received"),
      receivedHint: t("stats.receivedHint"),
      due: t("stats.due"),
      dueHint: t("stats.dueHint"),
    }
  };

  return (
    <BillingDashboard 
      locale={locale} 
      translations={translations} 
      data={billing} 
    />
  );
}
