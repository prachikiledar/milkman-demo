import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import type { AppLocale } from "@/i18n/routing";

type PlatformHeaderProps = {
  locale: AppLocale;
  /**
   * Where the brand should link to. Defaults to /{locale}
   * which renders the landing page.
   */
  homeHref?: string;
  showTagline?: boolean;
};

export async function PlatformHeader({
  locale,
  homeHref,
  showTagline = true,
}: PlatformHeaderProps) {
  const t = await getTranslations({ locale, namespace: "brand" });

  return (
    <header className="platform-header">
      <Link href={homeHref ?? `/${locale}`} className="brand" aria-label={t("name")}>
        <svg
          viewBox="0 0 32 32"
          width="26"
          height="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2h8v4l3 6c1 2 1 4 1 6v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V18c0-2 0-4 1-6l3-6V2z" />
          <path d="M11 14h10" />
        </svg>
        <span className="brand-text">
          <span className="brand-name">{t("name")}</span>
          {showTagline ? <span className="brand-tagline">{t("tagline")}</span> : null}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <UserMenu locale={locale} />
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
