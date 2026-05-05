"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // Extract locale from pathname if present
      const segments = pathname.split("/");
      const locale = segments[1] || "en";
      const loginPath = `/${locale}/login`;

      if (!token) {
        if (pathname.includes("/admin") || pathname.includes("/customer")) {
          const intendedRole = pathname.includes("/admin") ? "admin" : "customer";
          router.push(`${loginPath}?role=${intendedRole}`);
        } else {
          setAuthorized(true);
        }
        return;
      }

      // Role based protection
      if (pathname.includes("/admin") && user?.role !== "ADMIN") {
        router.push(loginPath);
        return;
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [pathname, router]);

  if (!authorized && (pathname.includes("/admin") || pathname.includes("/customer"))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
