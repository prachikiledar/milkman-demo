import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutDashboard, UserCircle, ArrowRight } from "lucide-react";

type SelectRolePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SelectRolePage({ params }: SelectRolePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <main className="app-shell-main flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {t("selectRole.title")}
          </h1>
          <p className="text-slate-500 font-medium">
            {t("selectRole.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Option */}
          <Link 
            href={`/${locale}/customer/dashboard`} 
            className="premium-card group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="mt-8 flex-1">
              <h3 className="text-2xl font-black text-slate-900">
                {t("selectRole.customer")}
              </h3>
              <p className="mt-3 text-slate-500 leading-relaxed text-sm">
                {t("selectRole.customerDesc")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Admin Option */}
          <Link 
            href={`/${locale}/admin/dashboard`} 
            className="premium-card group"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <div className="mt-8 flex-1">
              <h3 className="text-2xl font-black text-slate-900">
                {t("selectRole.admin")}
              </h3>
              <p className="mt-3 text-slate-500 leading-relaxed text-sm">
                {t("selectRole.adminDesc")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
