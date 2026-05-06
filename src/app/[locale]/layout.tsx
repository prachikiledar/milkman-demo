import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { PlatformHeader } from "@/components/layout/platform-header";
import { locales, type AppLocale } from "@/i18n/routing";
import { ConditionalHeader } from "@/components/layout/conditional-header";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="app-shell" lang={locale}>
        <ConditionalHeader>
          <PlatformHeader locale={locale as AppLocale} />
        </ConditionalHeader>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
