import { LoginForm } from "@/components/auth/login-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <main className="app-shell-main flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
