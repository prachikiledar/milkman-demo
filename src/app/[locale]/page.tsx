import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, LayoutDashboard, UserCircle } from "lucide-react";

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-12 lg:flex-row">
          {/* Left Content */}
          <div className="hero-content text-center lg:text-left">
            <h1 className="hero-title">
              {t("landing.heroTitle")}
            </h1>
            <p className="hero-subtitle">
              {t("landing.heroSubtitle")}
            </p>
            <div className="flex justify-center lg:justify-start">
              <a
                href="#options"
                className="btn-brand flex h-14 w-full md:w-auto mt-4 items-center justify-center rounded-full px-10 text-base font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {t("landing.startNow")}
              </a>
            </div>
          </div>

          {/* Right Image */}
          <div className="hero-image-container flex items-center justify-center">
            <img
              src="/milk1.png"
              alt="Fresh Premium Milk"
              width={350}
              height={350}
              className="floating-image"
            />
          </div>
        </div>

        {/* Liquid White Wave */}
        <div className="hero-wave">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              className="shape-fill"
              d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,170.7C672,128,768,64,864,64C960,64,1056,128,1152,144C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Options Section */}
      <section id="options" className="landing-cards-container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Customer Card */}
          <Link href={`/${locale}/customer/dashboard`} className="premium-card group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="mt-4 sm:mt-8 flex-1">
              <h3 className="text-2xl font-extrabold text-slate-900">{t("landing.customerView")}</h3>
              <p className="mt-3 text-slate-500 leading-relaxed">
                {t("landing.customerDesc")}
              </p>
            </div>
            <div className="mt-4 sm:mt-8 flex items-center gap-2 font-bold text-slate-900">
              <span>{t("nav.dashboard")} · {t("nav.calendar")}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link href={`/${locale}/admin/dashboard`} className="premium-card group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div className="mt-4 sm:mt-8 flex-1">
              <h3 className="text-2xl font-extrabold text-slate-900">{t("landing.openAdmin")}</h3>
              <p className="mt-3 text-slate-500 leading-relaxed">
                {t("landing.adminDesc")}
              </p>
            </div>
            <div className="mt-4 sm:mt-8 flex items-center gap-2 font-bold text-slate-900">
              <span>{t("nav.customers")} · {t("nav.deliveries")}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Footer / Info */}
      <footer className="mt-12 py-12 text-center text-slate-400">
        <p className="text-sm font-medium tracking-wide uppercase">{t("landing.copyright")}</p>
      </footer>
    </main>
  );
}
