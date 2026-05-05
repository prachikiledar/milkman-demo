"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAdminPath = pathname.includes("/admin");
      const isCustomerPath = pathname.includes("/customer");
      
      if (!isAdminPath && !isCustomerPath) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      const roleKey = isAdminPath ? "ADMIN" : "CUSTOMER";
      
      // Prioritize role-specific token, DO NOT fallback to generic token for protected paths
      // to avoid session bleeding between roles.
      const token = localStorage.getItem(`token_${roleKey}`);
      const userStr = localStorage.getItem(`user_${roleKey}`);
      
      let user = null;
      try {
        user = userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        console.error("AuthGuard: Failed to parse user", e);
      }

      // If we have a valid token and the correct role, we are authorized
      if (token && user && String(user.role).toUpperCase() === roleKey) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        
        // As a fallback for client-side navigation
        const segments = pathname.split("/");
        const locale = segments[1] || "en";
        const loginPath = `/${locale}/login`;
        router.push(`${loginPath}?role=${roleKey.toLowerCase()}`);
      }
      setLoading(false);
    };

    setLoading(true);
    checkAuth();
  }, [pathname, router]);

  if (loading || (!authorized && (pathname.includes("/admin") || pathname.includes("/customer")))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
