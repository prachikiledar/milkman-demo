"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Loader2, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

export function UserMenu({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Robust landing page check: /en, /hi, /pa, /en/, / or empty
  const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === "/" || pathname === "";

  if (!mounted || isLandingPage) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center h-9 w-9 text-slate-900 bg-slate-100/80 rounded-full border border-slate-200/50">
        <User size={18} className="text-blue-600" />
      </div>
    </div>
  );
}
