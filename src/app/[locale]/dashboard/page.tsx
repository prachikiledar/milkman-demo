"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (user) {
      router.push("/customer/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
    </div>
  );
}
