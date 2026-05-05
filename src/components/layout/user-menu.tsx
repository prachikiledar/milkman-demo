"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Loader2, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

export function UserMenu({ locale }: { locale: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();

  // Robust landing page check: /en, /hi, /pa, /en/, / or empty
  const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/` || pathname === "/" || pathname === "";

  useEffect(() => {
    if (isLandingPage) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const isAdminPath = pathname.includes("/admin");
      const isCustomerPath = pathname.includes("/customer");
      
      let roleKey = isAdminPath ? "ADMIN" : (isCustomerPath ? "CUSTOMER" : null);
      
      let token = roleKey ? localStorage.getItem(`token_${roleKey}`) : null;
      
      if (!token) {
        token = localStorage.getItem("token_ADMIN") || localStorage.getItem("token_CUSTOMER");
        if (!roleKey) {
          roleKey = localStorage.getItem("token_ADMIN") ? "ADMIN" : (localStorage.getItem("token_CUSTOMER") ? "CUSTOMER" : null);
        }
      }

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (roleKey) {
            localStorage.setItem(`user_${roleKey}`, JSON.stringify(data.user));
          }
        } else {
          if (roleKey) {
            localStorage.removeItem(`token_${roleKey}`);
            localStorage.removeItem(`user_${roleKey}`);
          }
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [pathname, isLandingPage, locale]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const isAdminPath = pathname.includes("/admin");
      const roleKey = isAdminPath ? "ADMIN" : (user?.role || "CUSTOMER");
      
      localStorage.removeItem(`token_${roleKey}`);
      localStorage.removeItem(`user_${roleKey}`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      await fetch("/api/auth/logout", { method: "POST" });
      
      setUser(null);
      router.push(`/${locale}/login?role=${roleKey.toLowerCase()}`);
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  // Requirements: On landing page, do NOT show phone number, Sign Out, or Login button.
  if (isLandingPage) {
    return null;
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  }


  if (!user) {
    return (
      <Link
        href={`/${locale}/login?role=customer`}
        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
      >
        <LogIn size={16} />
        <span>{t("login") || "Login"}</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-900 font-bold bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50">
        <User size={14} className="text-blue-600" />
        <span>{user.phone}</span>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="group flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-slate-700 bg-white rounded-full hover:bg-slate-50 transition-all border border-slate-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        title="Sign Out"
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <LogOut size={18} className="text-slate-500 group-hover:text-rose-600 transition-colors" />
        )}
        <span className="hidden md:inline">
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </span>
      </button>
    </div>
  );
}
