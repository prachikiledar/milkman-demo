import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeliveryOperationsPanel } from "@/components/deliveries/delivery-operations-panel";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAreasData, getDeliveryRunData } from "@/lib/data-service";

type AdminDeliveriesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDeliveriesPage({
  params,
  searchParams,
}: AdminDeliveriesPageProps) {
  const { locale } = await params;
  const query = (await searchParams) || {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.deliveries" });
  const selectedDate =
    typeof query.date === "string" && query.date ? query.date : new Date().toISOString().slice(0, 10);
  const selectedArea = typeof query.area === "string" ? query.area : "";
  const selectedStatus =
    typeof query.status === "string" &&
    ["ALL", "DELIVERED", "SKIPPED", "PAUSED", "PENDING"].includes(query.status)
      ? query.status
      : "ALL";
  const startRun = query.start === "1";
  const [entries, countEntries, areas] = await Promise.all([
    getDeliveryRunData({
      date: selectedDate,
      areaCode: selectedArea || undefined,
      status: selectedStatus as "ALL" | "DELIVERED" | "SKIPPED" | "PAUSED" | "PENDING",
    }),
    getDeliveryRunData({
      date: selectedDate,
      areaCode: selectedArea || undefined,
      status: "ALL",
    }),
    getAreasData(),
  ]);

  const deliveredCount = countEntries.filter((entry) => entry.status === "DELIVERED").length;
  const skippedCount = countEntries.filter((entry) => entry.status === "SKIPPED").length;
  const pausedCount = countEntries.filter((entry) => entry.status === "PAUSED").length;
  const pendingCount = countEntries.filter((entry) => entry.status === "PENDING").length;

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <DeliveryOperationsPanel
        entries={entries}
        areas={areas.map((area) => ({ code: area.code, name: area.name }))}
        counts={{
          delivered: deliveredCount,
          skipped: skippedCount,
          paused: pausedCount,
          pending: pendingCount,
          total: countEntries.length,
        }}
        filters={{
          date: selectedDate,
          area: selectedArea,
          status: selectedStatus as "ALL" | "DELIVERED" | "SKIPPED" | "PAUSED" | "PENDING",
        }}
        locale={locale}
        startRun={startRun}
      />
    </AdminShell>
  );
}
