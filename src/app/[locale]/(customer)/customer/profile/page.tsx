import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Building2,
  LogOut,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getCustomerProfileData } from "@/lib/data-service";
import {
  locales,
  localeLabels,
  type AppLocale,
} from "@/i18n/routing";

type CustomerProfilePageProps = {
  params: Promise<{ locale: string }>;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const profile = await getCustomerProfileData();

  const preferredLanguageLabel = profile
    ? localeLabels[(profile.preferredLanguage as AppLocale) ?? "en"]?.native ??
      localeLabels.en.native
    : null;

  return (
    <CustomerShell locale={locale}>
      <div className="app-header">
        <div>
          <div className="title">{t("profile.title")}</div>
          <div className="subtitle">{t("profile.subtitle")}</div>
        </div>
      </div>

      {profile ? (
        <>
          {/* Identity card */}
          <article className="card">
            <div className="card-row">
              <div className="avatar" aria-hidden="true">
                {initials(profile.name)}
              </div>
              <div className="flex-1">
                <div className="card-title">{profile.name}</div>
                <div className="card-sub">
                  {profile.areaName} · {profile.areaCode}
                </div>
              </div>
            </div>
          </article>

          {/* Contact info */}
          <div className="section-head">
            <h3>{t("profile.title")}</h3>
          </div>
          <div className="split-2">
            <article className="list-item">
              <div className="thumb">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="meta">
                <strong>{t("profile.name")}</strong>
                <span>{profile.name}</span>
              </div>
            </article>
            <article className="list-item">
              <div className="thumb mint">
                <Phone className="h-5 w-5" />
              </div>
              <div className="meta">
                <strong>{t("profile.phone")}</strong>
                <span>{profile.phone || t("common.notAvailable")}</span>
              </div>
            </article>
            <article className="list-item">
              <div className="thumb sun">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="meta">
                <strong>{t("profile.address")}</strong>
                <span>{profile.address || t("common.notAvailable")}</span>
              </div>
            </article>
            <article className="list-item">
              <div className="thumb rose">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="meta">
                <strong>{t("profile.area")}</strong>
                <span>
                  {profile.areaName} · {profile.areaCode}
                </span>
              </div>
            </article>
          </div>

          {/* Language */}
          <div className="section-head">
            <h3>{t("lang.label")}</h3>
          </div>
          <article className="card">
            <div className="row between">
              <div>
                <div className="card-title">{t("profile.preferredLanguage")}</div>
                <div className="card-sub">
                  {preferredLanguageLabel ??
                    locales.map((code) => localeLabels[code].native).join(" · ")}
                </div>
              </div>
              <LanguageSwitcher locale={locale as AppLocale} />
            </div>
          </article>

          {/* Sign out */}
          <div className="mt-4">
            <button type="button" className="btn btn-ghost btn-block">
              <LogOut className="h-4 w-4" />
              {t("profile.signOut")}
            </button>
          </div>
        </>
      ) : (
        <section className="card">
          <p className="card-sub">{t("dashboard.noCustomer")}</p>
        </section>
      )}
    </CustomerShell>
  );
}
