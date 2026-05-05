import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { getCustomerHistoryData } from "@/lib/data-service";

type CustomerHistoryPageProps = {
  params: Promise<{ locale: string }>;
};

const statusToChip: Record<
  string,
  { className: string; dotClass: string; icon: typeof CheckCircle2 }
> = {
  DELIVERED: { className: "mint", dotClass: "mint", icon: CheckCircle2 },
  PAUSED: { className: "sun", dotClass: "sun", icon: PauseCircle },
  SKIPPED: { className: "rose", dotClass: "rose", icon: XCircle },
  PENDING: { className: "", dotClass: "", icon: Clock },
};

export default async function CustomerHistoryPage({
  params,
}: CustomerHistoryPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const entries = await getCustomerHistoryData();

  return (
    <CustomerShell locale={locale}>
      <div className="app-header">
        <div>
          <div className="title">{t("history.title")}</div>
          <div className="subtitle">{t("history.subtitle")}</div>
        </div>
      </div>

      {entries.length === 0 ? (
        <section className="card">
          <p className="card-sub">{t("history.empty")}</p>
        </section>
      ) : (
        <div className="split-2">
          {entries.map((entry, idx) => {
            const chip = statusToChip[entry.status] ?? statusToChip.PENDING;
            const Icon = chip.icon;
            const statusKey = entry.status.toLowerCase() as
              | "delivered"
              | "paused"
              | "skipped"
              | "pending";
            return (
              <article key={`${entry.dateLabel}-${idx}`} className="list-item">
                <div className={`thumb ${chip.className || ""}`.trim()}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="meta">
                  <strong>{entry.dateLabel}</strong>
                  <span>
                    {entry.finalQuantity.toFixed(1)} {t("common.liters")}
                    {entry.extraQuantity > 0
                      ? ` · ${t("history.extra", {
                          amount: entry.extraQuantity.toFixed(1),
                        })}`
                      : ""}
                  </span>
                  {entry.addOnItems.length ? (
                    <span>
                      {t("history.addOnsLabel")}{" "}
                      {entry.addOnItems
                        .map(
                          (item) =>
                            `${item.productName || item.productCode} × ${item.quantity || 0}`,
                        )
                        .join(", ")}
                    </span>
                  ) : null}
                </div>
                <span className={`chip ${chip.className || ""}`.trim()}>
                  {chip.dotClass ? (
                    <span className={`status-dot ${chip.dotClass}`} />
                  ) : null}
                  {t(`status.${statusKey}` as never)}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
