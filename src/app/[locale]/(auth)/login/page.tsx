import { redirect } from "next/navigation";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { role } = await searchParams;
  
  if (role === "customer") {
    redirect(`/${locale}/customer/dashboard`);
  }
  
  redirect(`/${locale}/admin/dashboard`);
}
